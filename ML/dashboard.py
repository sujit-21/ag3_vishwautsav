import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor # Ready for future AI predictions

# Set page config for a wider layout
st.set_page_config(page_title="Vishwautsav Analytics", layout="wide")

st.title("📊 Vishwautsav Analytics Dashboard")
st.markdown("Welcome to the Admin Dashboard. Use the filters on the left to slice the data.")

# ==========================================
# 1. SIDEBAR FILTERS (Entity & Festival)
# ==========================================
st.sidebar.header("Data Filters")

# In the future, these will be fetched from your database
entities = ["All Entities", "Entity A", "Entity B"]
festivals = ["All Festivals", "Music Concert", "Holi", "South Festivals"]

selected_entity = st.sidebar.selectbox("Select Entity", entities)
selected_festival = st.sidebar.selectbox("Select Festival/Event", festivals)

st.sidebar.markdown("---")
st.sidebar.info("Future AI Feature: Random Forest prediction models will be added here.")

# ==========================================
# 2. DUMMY DATA (Replace with DB connection)
# ==========================================
# Here is where you will write code to connect to your Database (e.g., MongoDB)
# For now, we use dummy data so you can see how the charts look!
data = {
    "Year": [2022, 2023, 2024],
    "Subscription_Amount": [50000, 75000, 120000],
    "Expenses": [30000, 45000, 60000]
}
df_financials = pd.DataFrame(data)

# ==========================================
# 3. FINANCIALS (Year-wise Subscriptions vs Expenses)
# ==========================================
st.subheader(f"Financial Overview ({selected_entity} - {selected_festival})")

# We create a bar chart using Streamlit's native charting (very easy)
st.bar_chart(
    df_financials.set_index("Year")[["Subscription_Amount", "Expenses"]],
    use_container_width=True
)

st.divider()

# Create two columns for the pie charts
col1, col2 = st.columns(2)

# ==========================================
# 4. PAYMENT STATUS (Paid, Due, Online)
# ==========================================
with col1:
    st.subheader("User Payment Status")
    
    payment_labels = ['Paid User', 'Due User', 'Online Paid User']
    payment_sizes = [400, 150, 600] # Replace with real DB counts
    
    fig1, ax1 = plt.subplots()
    ax1.pie(payment_sizes, labels=payment_labels, autopct='%1.1f%%', startangle=90, colors=['#4CAF50', '#F44336', '#2196F3'])
    ax1.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.
    
    st.pyplot(fig1)

# ==========================================
# 5. USER TIER TYPES (None, Prime, VIP, Admin)
# ==========================================
with col2:
    st.subheader("User Tier Breakdown")
    
    tier_labels = ['None Tier', 'Prime Tier', 'VIP Tier', 'Admin Tier']
    tier_sizes = [1000, 300, 50, 10] # Replace with real DB counts
    
    fig2, ax2 = plt.subplots()
    # Using a donut chart style here for variety
    wedges, texts, autotexts = ax2.pie(tier_sizes, labels=tier_labels, autopct='%1.1f%%', startangle=90, colors=['#9E9E9E', '#FFC107', '#9C27B0', '#000000'])
    
    # Draw circle in the center to make it a donut
    centre_circle = plt.Circle((0,0),0.70,fc='white')
    fig2.gca().add_artist(centre_circle)
    ax2.axis('equal')  
    
    st.pyplot(fig2)

# ==========================================
# AI PREDICTION PLACEHOLDER
# ==========================================
st.divider()
st.subheader("🤖 Future AI Predictions (Random Forest)")
st.write("The Random Forest Regressor is imported and ready. Once historical data is connected, this section will predict future subscription amounts based on past trends.")
