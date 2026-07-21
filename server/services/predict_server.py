from flask import Flask, request, jsonify
import joblib
import pickle
import numpy as np
import pandas as pd
import os
import sys

app = Flask(__name__)

# Paths to model files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'ml_models')

MODEL_PATH = os.path.join(MODEL_DIR, 'pakwheels_price_model.pkl')
COLUMNS_PATH = os.path.join(MODEL_DIR, 'model_columns.pkl')
ENCODERS_PATH = os.path.join(MODEL_DIR, 'label_encoders.pkl')

print("Loading ML models...", flush=True)
try:
    model = joblib.load(MODEL_PATH)
    with open(COLUMNS_PATH, 'rb') as f:
        model_columns = pickle.load(f)
    encoders = joblib.load(ENCODERS_PATH)
    print("ML models loaded successfully!", flush=True)
except Exception as e:
    print(f"Error loading ML models: {e}", file=sys.stderr, flush=True)
    sys.exit(1)

def encode_value(encoder, val):
    val_str = str(val).strip()
    if val_str in encoder.classes_:
        return encoder.transform([val_str])[0]
    
    # Try case-insensitive match
    val_lower = val_str.lower()
    for c in encoder.classes_:
        if str(c).strip().lower() == val_lower:
            return encoder.transform([c])[0]
            
    # Try substring match
    for c in encoder.classes_:
        if val_lower in str(c).strip().lower():
            return encoder.transform([c])[0]
            
    # Fallback to the first class in the encoder
    return encoder.transform([encoder.classes_[0]])[0]

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        # Required inputs from request
        make = data.get('make', '')
        model_name = data.get('model', '')
        year = data.get('year', 2024)
        body_type = data.get('bodyType', '')
        mileage = data.get('mileage', 0)
        fuel_type = data.get('fuelType', '')
        transmission = data.get('transmission', '')
        color = data.get('color', '')
        location = data.get('location', 'Lahore')
        assembly = data.get('assembly', 'Local')
        engine_cc = data.get('engineDisplacement', '')

        # Clean/Format inputs
        try:
            year_val = int(year)
        except Exception:
            year_val = 2024

        try:
            mileage_val = int(mileage)
        except Exception:
            mileage_val = 0

        # Construct raw strings for specific model requirements
        mileage_str = f"{mileage_val:,} km"
        
        # Engine displacement cleaning and formatting (e.g. "1300cc" or "1300 cc")
        if not engine_cc:
            engine_displacement_str = '1300cc'
            engine_capacity_str = '1300 cc'
        else:
            # Extract digits
            digits = ''.join(c for c in str(engine_cc) if c.isdigit())
            if not digits:
                engine_displacement_str = '1300cc'
                engine_capacity_str = '1300 cc'
            else:
                engine_displacement_str = f"{digits}cc"
                engine_capacity_str = f"{digits} cc"

        # Build feature dictionary
        features = {}
        
        # 1. model
        features['model'] = encode_value(encoders['model'], model_name)
        # 2. itemCondition
        features['itemCondition'] = encode_value(encoders['itemCondition'], 'used')
        # 3. modelDate
        features['modelDate'] = float(year_val)
        # 4. manufacturer
        features['manufacturer'] = encode_value(encoders['manufacturer'], make)
        # 5. fuelType
        features['fuelType'] = encode_value(encoders['fuelType'], fuel_type)
        # 6. vehicleTransmission
        features['vehicleTransmission'] = encode_value(encoders['vehicleTransmission'], transmission)
        # 7. color
        features['color'] = encode_value(encoders['color'], color)
        # 8. bodyType
        features['bodyType'] = encode_value(encoders['bodyType'], body_type)
        # 9. mileageFromOdometer
        features['mileageFromOdometer'] = encode_value(encoders['mileageFromOdometer'], mileage_str)
        # 10. sellerLocation
        features['sellerLocation'] = encode_value(encoders['sellerLocation'], location)
        # 11. brand.@type
        features['brand.@type'] = encode_value(encoders['brand.@type'], 'Brand')
        # 12. brand.name
        features['brand.name'] = encode_value(encoders['brand.name'], make)
        # 13. vehicleEngine.@type
        features['vehicleEngine.@type'] = encode_value(encoders['vehicleEngine.@type'], 'EngineSpecification')
        # 14. vehicleEngine.engineDisplacement
        features['vehicleEngine.engineDisplacement'] = encode_value(encoders['vehicleEngine.engineDisplacement'], engine_displacement_str)
        # 15. extraFeatures.RegisteredIn
        features['extraFeatures.RegisteredIn'] = encode_value(encoders['extraFeatures.RegisteredIn'], location)
        # 16. extraFeatures.Color
        features['extraFeatures.Color'] = encode_value(encoders['extraFeatures.Color'], color)
        # 17. extraFeatures.Assembly
        features['extraFeatures.Assembly'] = encode_value(encoders['extraFeatures.Assembly'], assembly)
        # 18. extraFeatures.EngineCapacity
        features['extraFeatures.EngineCapacity'] = encode_value(encoders['extraFeatures.EngineCapacity'], engine_capacity_str)
        # 19. extraFeatures.BodyType
        features['extraFeatures.BodyType'] = encode_value(encoders['extraFeatures.BodyType'], body_type)
        # 20. extraFeatures.LastUpdated:
        features['extraFeatures.LastUpdated:'] = encode_value(encoders['extraFeatures.LastUpdated:'], 'Aug 02, 2021')
        # 21. extraFeatures.AdRef#
        features['extraFeatures.AdRef#'] = encode_value(encoders['extraFeatures.AdRef#'], '1009325')

        # Convert to DataFrame and align columns
        df = pd.DataFrame([features])
        df = df[model_columns]

        # Predict log price and expm1
        log_price = model.predict(df)[0]
        predicted_price = np.expm1(log_price)

        return jsonify({
            'predicted_price': float(predicted_price),
            'log_price': float(log_price)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run prediction server on port 5002
    print("Starting Flask Prediction Server on port 5002...", flush=True)
    app.run(host='0.0.0.0', port=5002)
