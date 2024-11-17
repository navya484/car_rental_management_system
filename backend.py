from flask import Flask, request, jsonify
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, Enum, ForeignKey, Text, TIMESTAMP, func, DECIMAL
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import enum
from flask_cors import CORS
import logging
app = Flask(__name__)
CORS(app)
# Database connection setup
username = 'root' 
password = 'root123'  
host = 'localhost'  
database = 'rental'  

# Create the SQLAlchemy engine
engine = create_engine(f'mysql+pymysql://{username}:{password}@{host}/{database}')

# Check if the engine is created successfully
try:
    with engine.connect() as connection:
        print("Connection to the database was successful!")
except Exception as e:
    print(f"An error occurred: {e}")

# Initialize Base and Session
Base = declarative_base()
Session = sessionmaker(bind=engine)
session = Session()

# Enum definitions
class UserRole(enum.Enum):
    admin = 'admin'
    user = 'user'

class VehicleCategory(enum.Enum):
    economy = 'economy'
    luxury = 'luxury'
    SUV = 'SUV'

class VehicleStatus(enum.Enum):
    available = 'available'
    booked = 'booked'
    maintenance = 'maintenance'

class BookingStatus(enum.Enum):
    confirmed = 'confirmed'
    completed = 'completed'
    cancelled = 'cancelled'

class PaymentStatus(enum.Enum):
    paid = 'paid'
    pending = 'pending'
    failed = 'failed'

class PaymentMethod(enum.Enum):
    credit_card = 'credit_card'
    debit_card = 'debit_card'
    paypal = 'paypal'

# ORM model definitions
class User(Base):
    __tablename__ = 'user'
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    full_name = Column(String(100), nullable=True)
    user_role = Column(Enum(UserRole), nullable=True, default=UserRole.user)
    created_at = Column(TIMESTAMP, nullable=True, default=func.now())
    customer_info = relationship('CustomerInfo', uselist=False, back_populates='user')

    def as_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

class Vehicle(Base):
    __tablename__ = 'vehicles'
    vehicle_id = Column(Integer, primary_key=True, autoincrement=True)
    make = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    category = Column(Enum(VehicleCategory), nullable=False)
    status = Column(Enum(VehicleStatus), nullable=True, default=VehicleStatus.available)
    daily_rate = Column(DECIMAL(10, 2), nullable=False)
    created_at = Column(TIMESTAMP, nullable=True, default=func.now())
    maintenance = relationship('Maintenance', back_populates='vehicle')

    def as_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

class Booking(Base):
    __tablename__ = 'bookings'
    booking_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('user.user_id'), nullable=False)
    vehicle_id = Column(Integer, ForeignKey('vehicles.vehicle_id'), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.confirmed)
    timestamp = Column(TIMESTAMP, nullable=True, default=func.now())
    payment = relationship('Payment', uselist=False, back_populates='booking')

    def as_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

class CustomerInfo(Base):
    __tablename__ = 'customer_info'
    customer_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('user.user_id'), nullable=False)
    address = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)

    user = relationship('User', back_populates='customer_info')

    def as_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

class Payment(Base):
    __tablename__ = 'payments'
    payment_id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey('bookings.booking_id'), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.pending)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    timestamp = Column(TIMESTAMP, nullable=True, default=func.now())

    booking = relationship('Booking', back_populates='payment')

    def as_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

class Maintenance(Base):
    __tablename__ = 'maintenance'
    maintenance_id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey('vehicles.vehicle_id'), nullable=False)
    status = Column(Enum(VehicleStatus), nullable=False, default=VehicleStatus.maintenance)
    description = Column(Text, nullable=True)
    timestamp = Column(TIMESTAMP, nullable=True, default=func.now())

    vehicle = relationship('Vehicle', back_populates='maintenance')

    def as_dict(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

# Create tables
Base.metadata.create_all(engine)

# Configure logging
logging.basicConfig(filename='car_rental.log', level=logging.INFO, format='%(asctime)s:%(levelname)s:%(message)s')

# Initialize Flask app and JWT

app.config['JWT_SECRET_KEY'] = '7356226196'
jwt = JWTManager(app)

# Function to check if a vehicle is available for a given date range
def is_vehicle_available(session, vehicle_id, start_date, end_date):
    # Query to find conflicting bookings
    conflicts = session.query(Booking).filter(
        Booking.vehicle_id == vehicle_id,
        Booking.status == BookingStatus.confirmed,
        Booking.end_date >= start_date,
        Booking.start_date <= end_date
    ).all()
    return len(conflicts) == 0  # True if no conflicts, meaning the vehicle is available

# User login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')  # Using get in case key doesn't exist
    password = data.get('password')

    print(f"Received login attempt - Username: {username}, Password: {password}")

    # Check if the user exists by querying the user table using the provided username
    user = session.query(User).filter_by(username=username).first()

    if user:
        print(f"User found: {user.username}")
        print(f"password:{user.password}")
    else:
        print("No user found with the provided username.")

    # If the user exists and the password matches the hashed password stored in the database
    if user and user.password== password:
        print("Login successful")
        # Generate a JWT token upon successful login
        access_token = create_access_token(identity=user.user_id)
        print(f"JWT Token generated: {access_token}")
        return jsonify(access_token=access_token)
    
    # If user doesn't exist or credentials are incorrect
    print("Invalid username or password.")
    return jsonify({'error': 'Invalid username or password'}), 401


# Create a new user (self-registration)
@app.route('/register', methods=['POST'])
def register_user():
    data = request.json

    # Check if the username or email already exists
    existing_user = session.query(User).filter((User.username == data['username']) | (User.email == data['email'])).first()
    if existing_user:
        return jsonify({'error': 'Username or email already exists'}), 400

    # Create and store the new user
    hashed_password = generate_password_hash(data['password'], method='sha256')
    user = User(username=data['username'], password=hashed_password, email=data['email'], full_name=data['full_name'])
    session.add(user)
    session.commit()

    return jsonify(user.as_dict()), 201

# Fetch all users
@app.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    users = session.query(User).all()
    return jsonify([user.as_dict() for user in users])

# Promote user to admin
@app.route('/admin/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def promote_user_to_admin(user_id):
    current_user = get_jwt_identity()
    user = session.query(User).filter_by(user_id=user_id).first()
    
    if user is None:
        return jsonify({'error': 'User not found'}), 404

    # Check if the current user is admin before promoting another user
    current_user_obj = session.query(User).filter_by(user_id=current_user).first()
    if current_user_obj.user_role != UserRole.admin:
        return jsonify({'error': 'You do not have permission to perform this action'}), 403
    
    # Promote user to admin
    user.user_role = UserRole.admin
    session.commit()
    
    return jsonify(user.as_dict()), 200



# Add new vehicle
@app.route('/vehicles', methods=['POST'])
@jwt_required()
def add_vehicle():
    data = request.json
    vehicle = Vehicle(
        make=data['make'],
        model=data['model'],
        year=data['year'],
        category=data['category'],
        daily_rate=data['daily_rate']
    )
    session.add(vehicle)
    session.commit()
    return jsonify(vehicle.as_dict()), 201

# Make a booking
@app.route('/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    data = request.json
    vehicle_id = data['vehicle_id']
    start_date = data['start_date']
    end_date = data['end_date']
    
    # Check if the vehicle is available for the given date range
    if not is_vehicle_available(session, vehicle_id, start_date, end_date):
        return jsonify({'error': 'Vehicle not available for the selected dates.'}), 400

    # Create the booking with status 'pending' to wait for payment
    booking = Booking(
        user_id=get_jwt_identity(),
        vehicle_id=vehicle_id,
        start_date=start_date,
        end_date=end_date,
        total_amount=data['total_amount'],
        status=BookingStatus.pending  # Initially set status to 'pending'
    )
    session.add(booking)
    session.commit()
    
    # Return the booking details along with the next steps (redirect to payment)
    return jsonify({
        'message': 'Booking created successfully. Please proceed with payment.',
        'booking_id': booking.booking_id,
        'status': booking.status,
        'payment_page_url': f'/payments/{booking.booking_id}'  # URL to redirect for payment
    }), 201

# Payment page endpoint: user will be redirected here for payment processing
@app.route('/payments/<int:booking_id>', methods=['GET'])
@jwt_required()
def payment_page(booking_id):
    # Fetch booking by ID
    booking = session.query(Booking).filter_by(booking_id=booking_id).first()
    
    if booking is None:
        return jsonify({'error': 'Booking not found'}), 404
    
    # Check if the booking belongs to the logged-in user
    if booking.user_id != get_jwt_identity():
        return jsonify({'error': 'You are not authorized to view this booking'}), 403
    
    # If booking status is 'pending', proceed to payment
    if booking.status == BookingStatus.pending:
        return jsonify({
            'message': 'Please complete your payment to confirm the booking.',
            'total_amount': str(booking.total_amount),
            'payment_method_options': ['credit_card', 'debit_card', 'paypal'],
        })
    
    # If the booking is not 'pending', inform the user about its status
    return jsonify({'error': 'This booking has already been processed or cancelled.'}), 400

# Payment processing (user clicks "Pay" button)
@app.route('/payments/<int:booking_id>/pay', methods=['POST'])
@jwt_required()
def pay_for_booking(booking_id):
    # Fetch the booking by ID
    booking = session.query(Booking).filter_by(booking_id=booking_id).first()
    
    if booking is None:
        return jsonify({'error': 'Booking not found'}), 404
    
    # Check if the booking belongs to the logged-in user
    if booking.user_id != get_jwt_identity():
        return jsonify({'error': 'You are not authorized to pay for this booking'}), 403
    
    # Ensure the booking is in 'pending' status before payment
    if booking.status != BookingStatus.pending:
        return jsonify({'error': 'This booking cannot be paid for. Status: ' + booking.status.name}), 400
    
    # Simulate payment success (In real scenario, integrate payment gateway here)
    payment_data = request.json
    payment_method = payment_data.get('payment_method')
    payment_amount = booking.total_amount

    # You can perform actual payment processing with third-party service here (e.g., Stripe, PayPal)
    if payment_method not in PaymentMethod.__members__:
        return jsonify({'error': 'Invalid payment method.'}), 400

    # Assuming payment is successful
    payment = Payment(
        booking_id=booking_id,
        amount=payment_amount,
        status=PaymentStatus.paid,
        payment_method=payment_method
    )
    session.add(payment)

    # Update booking status to 'confirmed' after successful payment
    booking.status = BookingStatus.confirmed
    session.commit()

    # Send response confirming the payment and booking status
    return jsonify({
        'message': 'Payment successful and booking confirmed.',
        'booking_id': booking.booking_id,
        'status': booking.status,
        'payment_status': payment.status
    }), 200
@app.route('/vehicles', methods=['GET'])
def get_vehicles():
    try:
        print("Fetching available vehicles...")
        
        # Query to get available vehicles
        vehicles = session.query(Vehicle).filter_by(status=VehicleStatus.available).all()

        # Log the fetched data on the server side
        print(f"Fetched {len(vehicles)} vehicles from the database.")
        
        # Convert the result to a list of dictionaries
        vehicle_list = [
            {
                "vehicle_id": vehicle.vehicle_id,
                "make": vehicle.make,
                "model": vehicle.model,
                "year": vehicle.year,
                "category": vehicle.category.name,  # Convert enum to string
                "daily_rate": vehicle.daily_rate
            }
            for vehicle in vehicles
        ]
        
        # Log the vehicle data
        print(f"Vehicle data: {vehicle_list}")
        
        return jsonify(vehicle_list)
    
    except SQLAlchemyError as err:
        print(f"Error fetching vehicles: {str(err)}")
        return jsonify({"error": str(err)}), 500





# Run the app
if __name__ == '__main__':
    app.run(debug=True)

