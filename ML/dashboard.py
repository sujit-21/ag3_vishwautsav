import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from pymongo import MongoClient
from sklearn.ensemble import RandomForestRegressor

# Set page config for a wider layout
st.set_page_config(page_title="Vishwautsav Analytics", layout="wide")

st.title("📊 Vishwautsav Analytics Dashboard")
st.markdown("Welcome to the Admin Dashboard. Use the filters on the left to slice the live data from MongoDB.")

# ==========================================
# 1. MONGODB CONNECTION
# ==========================================
# This uses Streamlit's secrets manager to securely connect to your DB
@st.cache_resource
def init_connection():
    # Make sure you add MONGO_URI to your Streamlit Cloud secrets!
    uri = st.secrets["MONGO_URI"]
    client = MongoClient(uri)
    return client

try:
    client = init_connection()
    # It automatically gets the database name (vishwautsav_db) from your URI string
    db = client.get_default_database()
except Exception as e:
    st.error(f"Failed to connect to MongoDB. Did you add MONGO_URI to your Streamlit Secrets? Error: {e}")
    st.stop()

# ==========================================
# 2. FETCH DATA
# ==========================================
@st.cache_data(ttl=600) # Cache the data for 10 minutes to make the dashboard fast
def get_data():
    # Fetch subscriptions
    subs = list(db.subscriptions.find({}, {"_id": 0, "amount": 1, "date": 1, "entityName": 1, "festOrEventName": 1, "paymentType": 1, "membershipType": 1}))
    df_subs = pd.DataFrame(subs)
    
    # Fetch expenses
    expenses = list(db.expenses.find({}, {"_id": 0, "amount": 1, "date": 1, "festOrEventName": 1}))
    df_exp = pd.DataFrame(expenses)

    # Fetch unique entities and festivals for the dropdowns
    entities_list = ["All Entities"] + (df_subs['entityName'].dropna().unique().tolist() if not df_subs.empty else [])
    festivals_list = ["All Festivals"] + (df_subs['festOrEventName'].dropna().unique().tolist() if not df_subs.empty else [])

    return df_subs, df_exp, entities_list, festivals_list

df_subs, df_exp, entities_list, festivals_list = get_data()

# ==========================================
# 3. SIDEBAR FILTERS
# ==========================================
st.sidebar.header("Data Filters")

selected_entity = st.sidebar.selectbox("Select Entity", entities_list)
selected_festival = st.sidebar.selectbox("Select Festival/Event", festivals_list)

# Filter the dataframes based on selection
if selected_entity != "All Entities":
    df_subs = df_subs[df_subs['entityName'] == selected_entity]

if selected_festival != "All Festivals":
    df_subs = df_subs[df_subs['festOrEventName'] == selected_festival]
    if not df_exp.empty:
        df_exp = df_exp[df_exp['festOrEventName'] == selected_festival]

st.sidebar.markdown("---")
st.sidebar.info("Future AI Feature: Random Forest prediction models will be added here.")

# ==========================================
# 4. FINANCIALS (Year-wise Subscriptions vs Expenses)
# ==========================================
st.subheader(f"Financial Overview ({selected_entity} - {selected_festival})")

if not df_subs.empty or not df_exp.empty:
    # Process Subscriptions (EXCLUDE 'Due' payments)
    if not df_subs.empty:
        # Filter out Due payments
        df_paid_subs = df_subs[df_subs['paymentType'] != 'Due'].copy()
        
        if not df_paid_subs.empty:
            df_paid_subs['Year'] = pd.to_datetime(df_paid_subs['date']).dt.year
            subs_yearly = df_paid_subs.groupby('Year')['amount'].sum().reset_index()
            subs_yearly.rename(columns={'amount': 'Subscription_Amount'}, inplace=True)
        else:
            subs_yearly = pd.DataFrame(columns=['Year', 'Subscription_Amount'])
    else:
        subs_yearly = pd.DataFrame(columns=['Year', 'Subscription_Amount'])

    # Process Expenses
    if not df_exp.empty:
        df_exp['Year'] = pd.to_datetime(df_exp['date']).dt.year
        exp_yearly = df_exp.groupby('Year')['amount'].sum().reset_index()
        exp_yearly.rename(columns={'amount': 'Expenses'}, inplace=True)
    else:
        exp_yearly = pd.DataFrame(columns=['Year', 'Expenses'])

    # Merge them together by Year
    if not subs_yearly.empty and not exp_yearly.empty:
        df_financials = pd.merge(subs_yearly, exp_yearly, on='Year', how='outer').fillna(0)
    elif not subs_yearly.empty:
        df_financials = subs_yearly
        df_financials['Expenses'] = 0
    elif not exp_yearly.empty:
        df_financials = exp_yearly
        df_financials['Subscription_Amount'] = 0
    else:
        df_financials = pd.DataFrame(columns=['Year', 'Subscription_Amount', 'Expenses'])

    if not df_financials.empty:
        df_financials = df_financials.sort_values('Year')
        
        # Create a beautiful Grouped Bar Chart using Matplotlib
        fig, ax = plt.subplots(figsize=(10, 4))
        
        # Convert year back to string for the x-axis labels
        years = df_financials['Year'].astype(int).astype(str).tolist()
        x = range(len(years))
        width = 0.35
        
        ax.bar([i - width/2 for i in x], df_financials['Subscription_Amount'], width, label='Paid Subscriptions', color='#2196F3')
        ax.bar([i + width/2 for i in x], df_financials['Expenses'], width, label='Expenses', color='#F44336')
        
        ax.set_ylabel('Total Amount (₹)')
        ax.set_xticks(x)
        ax.set_xticklabels(years)
        ax.legend()
        
        # Make it look clean
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        
        st.pyplot(fig)
    else:
        st.info("No financial data found for the selected filters.")
else:
    st.info("No financial data found in the database.")

st.divider()

# Create two columns for the pie charts
col1, col2 = st.columns(2)

# ==========================================
# 5. PAYMENT STATUS (Paid, Due, Online)
# ==========================================
with col1:
    st.subheader("User Payment Status")
    
    if not df_subs.empty and 'paymentType' in df_subs.columns:
        payment_counts = df_subs['paymentType'].value_counts()
        
        if not payment_counts.empty:
            fig1, ax1 = plt.subplots()
            # Generate colors based on the payment type
            color_map = {'Cash & Paid': '#4CAF50', 'Due': '#F44336', 'Online': '#2196F3', 'Coupon or Token': '#FF9800'}
            colors = [color_map.get(ptype, '#9E9E9E') for ptype in payment_counts.index]
            
            ax1.pie(payment_counts.values, labels=payment_counts.index, autopct='%1.1f%%', startangle=90, colors=colors)
            ax1.axis('equal')
            st.pyplot(fig1)
        else:
            st.write("No payment data available.")
    else:
        st.write("No payment data available.")

# ==========================================
# 6. USER TIER TYPES (None, Prime, VIP, Admin)
# ==========================================
with col2:
    st.subheader("User Tier Breakdown")
    
    if not df_subs.empty and 'membershipType' in df_subs.columns:
        tier_counts = df_subs['membershipType'].value_counts()
        
        if not tier_counts.empty:
            fig2, ax2 = plt.subplots()
            
            color_map = {'Non-Prime': '#9E9E9E', 'Prime': '#FFC107', 'VIP': '#9C27B0', 'Admin': '#000000'}
            colors = [color_map.get(ttype, '#607D8B') for ttype in tier_counts.index]
            
            wedges, texts, autotexts = ax2.pie(tier_counts.values, labels=tier_counts.index, autopct='%1.1f%%', startangle=90, colors=colors)
            
            # Draw circle in the center to make it a donut
            centre_circle = plt.Circle((0,0),0.70,fc='white')
            fig2.gca().add_artist(centre_circle)
            ax2.axis('equal')  
            
            st.pyplot(fig2)
        else:
            st.write("No tier data available.")
    else:
        st.write("No tier data available.")

# ==========================================
# AI PREDICTION PLACEHOLDER
# ==========================================
st.divider()
st.subheader("🤖 Future AI Predictions (Random Forest)")
st.write("The Random Forest Regressor is imported and ready. Once historical data is connected, this section will predict future subscription amounts based on past trends.")
