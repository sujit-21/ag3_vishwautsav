import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import plotly.express as px
from pymongo import MongoClient
from sklearn.ensemble import RandomForestRegressor

# Set page config for a wider layout
st.set_page_config(page_title="Vishwautsav Analytics", layout="wide")

# ==========================================
# 0. QUERY PARAMS (Entity Filtering)
# ==========================================
# Get the 'entity' from the URL (e.g., ?entity=sakaripara)
url_entity = st.query_params.get("entity", None)

if url_entity:
    st.title(f"Vishwautsav Analytics Dashboard - {url_entity}")
    st.markdown(f"Welcome to the **{url_entity}** Dashboard. Here is your specific live data.")
else:
    st.title("Vishwautsav Analytics Dashboard")
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
@st.cache_data(ttl=5) # Cache data for only 5 seconds so it feels real-time!
def get_data():
    # Fetch subscriptions
    subs = list(db.subscriptions.find({}, {"_id": 0, "amount": 1, "date": 1, "entityName": 1, "festOrEventName": 1, "paymentType": 1, "membershipType": 1}))
    df_subs = pd.DataFrame(subs)
    
    # Fetch expenses
    expenses = list(db.expenses.find({}, {"_id": 0, "amount": 1, "date": 1, "festOrEventName": 1, "entityName": 1}))
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

if url_entity:
    # If an entity is in the URL, lock the dropdown to them
    selected_entity = url_entity
    st.sidebar.markdown(f"**Entity:** {selected_entity}")
else:
    selected_entity = st.sidebar.selectbox("Select Entity", entities_list)

selected_festival = st.sidebar.selectbox("Select Festival/Event", festivals_list)

# Filter the dataframes based on selection
if selected_entity != "All Entities":
    if not df_subs.empty and 'entityName' in df_subs.columns:
        df_subs = df_subs[df_subs['entityName'] == selected_entity]
    
    if not df_exp.empty:
        if 'entityName' in df_exp.columns:
            # Filter it strictly, fill NaN with empty string to avoid errors
            df_exp['entityName'] = df_exp['entityName'].fillna('')
            df_exp = df_exp[df_exp['entityName'] == selected_entity]
        else:
            # CRITICAL FIX: If entityName doesn't exist in DB for expenses,
            # clear the dataframe so other entities' expenses don't bleed through!
            df_exp = pd.DataFrame(columns=df_exp.columns)

if selected_festival != "All Festivals":
    if not df_subs.empty and 'festOrEventName' in df_subs.columns:
        df_subs = df_subs[df_subs['festOrEventName'] == selected_festival]
    if not df_exp.empty and 'festOrEventName' in df_exp.columns:
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
        
        # --- Add Professional KPI Metrics ---
        total_subs = df_financials['Subscription_Amount'].sum()
        total_exp = df_financials['Expenses'].sum()
        profit = total_subs - total_exp
        
        m1, m2, m3 = st.columns(3)
        m1.metric("Total Paid Subscriptions", f"₹{total_subs:,.0f}")
        m2.metric("Total Expenses", f"₹{total_exp:,.0f}")
        m3.metric("Net Balance", f"₹{profit:,.0f}", delta=f"₹{profit:,.0f}")
        st.markdown("<br>", unsafe_allow_html=True)
        # ------------------------------------
        
        # Create a beautiful Grouped Bar Chart using Matplotlib
        fig, ax = plt.subplots(figsize=(10, 5))
        
        # Convert year back to string for the x-axis labels
        years = df_financials['Year'].astype(int).astype(str).tolist()
        x = range(len(years))
        width = 0.35
        
        rects1 = ax.bar([i - width/2 for i in x], df_financials['Subscription_Amount'], width, label='Paid Subscriptions', color='#2196F3')
        rects2 = ax.bar([i + width/2 for i in x], df_financials['Expenses'], width, label='Expenses', color='#F44336')
        
        # Add labels directly on top of the bars to look professional!
        ax.bar_label(rects1, padding=3, fmt='₹{:,.0f}', fontsize=9, color='#2196F3', fontweight='bold')
        ax.bar_label(rects2, padding=3, fmt='₹{:,.0f}', fontsize=9, color='#F44336', fontweight='bold')
        
        ax.set_ylabel('Total Amount (₹)')
        # Increase the top y-limit slightly so the labels don't get cut off
        ax.margins(y=0.15)
        
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
        payment_counts = df_subs['paymentType'].value_counts().reset_index()
        payment_counts.columns = ['Payment Type', 'Count']
        
        if not payment_counts.empty:
            color_map = {'Cash & Paid': '#4CAF50', 'Due': '#F44336', 'Online': '#2196F3', 'Coupon or Token': '#FF9800'}
            
            fig1 = px.pie(
                payment_counts, 
                values='Count', 
                names='Payment Type',
                color='Payment Type',
                color_discrete_map=color_map,
                hole=0.4
            )
            fig1.update_traces(textposition='inside', textinfo='percent+label')
            fig1.update_layout(showlegend=False, margin=dict(t=0, b=0, l=0, r=0))
            
            st.plotly_chart(fig1, use_container_width=True)
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
        tier_counts = df_subs['membershipType'].value_counts().reset_index()
        tier_counts.columns = ['Tier Type', 'Count']
        
        if not tier_counts.empty:
            color_map = {'Non-Prime': '#9E9E9E', 'Prime': '#FFC107', 'VIP': '#9C27B0', 'Admin': '#000000'}
            
            fig2 = px.pie(
                tier_counts, 
                values='Count', 
                names='Tier Type',
                color='Tier Type',
                color_discrete_map=color_map,
                hole=0.6
            )
            fig2.update_traces(textposition='inside', textinfo='percent+label')
            fig2.update_layout(showlegend=False, margin=dict(t=0, b=0, l=0, r=0))
            
            st.plotly_chart(fig2, use_container_width=True)
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
