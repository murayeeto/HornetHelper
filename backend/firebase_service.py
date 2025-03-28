import firebase_admin
from firebase_admin import credentials, auth, firestore

# Initialize Firebase Admin with service account
cred = credentials.Certificate('./firebase/hornethelper-36e05-firebase-adminsdk-fbsvc-9e57dc05bb.json')
firebase_admin.initialize_app(cred)

# Get Firestore client
db = firestore.client()

def verify_id_token(id_token):
    """
    Verify Firebase ID token and return user info
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None

def get_user_data(user_id):
    """
    Get user data from Firestore
    """
    try:
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            return user_doc.to_dict()
        return None
    except Exception as e:
        print(f"Error getting user data: {e}")
        return None

def update_user_major(user_id, major):
    """
    Update user's major in Firestore
    """
    try:
        user_ref = db.collection('users').document(user_id)
        user_ref.update({
            'major': major
        })
        return True
    except Exception as e:
        print(f"Error updating user major: {e}")
        return False