import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import plotly.express as px
from pymongo import MongoClient
from sklearn.ensemble import RandomForestRegressor

# Set page config for a wider layout
st.set_page_config(page_title="Vishwautsav Analytics", layout="wide")

# Custom CSS: Move Plotly modebar tools below charts so they never overlap data labels
st.markdown(
    """
    <style>
    /* Ensure page content is never hidden behind Streamlit top bar */
    .block-container {
        padding-top: 4rem !important;
    }

    /* Responsive styling for smartphones and smaller screens */
    @media (max-width: 768px) {
        .block-container {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
            padding-top: 4.25rem !important;
            padding-bottom: 2.5rem !important;
            max-width: 100% !important;
        }

        /* Show ALL metric cards HORIZONTALLY with tight gaps - no huge empty spaces */
        [data-testid="stHorizontalBlock"] {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            align-items: stretch !important;
            gap: 6px !important;
            padding: 2px 0 8px 0 !important;
            margin: 0 !important;
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
        }

        [data-testid="stHorizontalBlock"] > div,
        [data-testid="stHorizontalBlock"] [data-testid="column"],
        [data-testid="stHorizontalBlock"] [data-testid="stColumn"] {
            flex: 0 0 110px !important;
            width: 110px !important;
            min-width: 110px !important;
            max-width: 110px !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
        }

        /* Metric card styling with high-contrast solid background and strict compact width */
        [data-testid="stHorizontalBlock"] [data-testid="stMetric"],
        [data-testid="stMetric"] {
            width: 110px !important;
            max-width: 110px !important;
            background: #0f172a !important;
            border: 1px solid rgba(255, 255, 255, 0.16) !important;
            border-radius: 8px !important;
            padding: 5px 6px !important;
            min-height: 54px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
            box-sizing: border-box !important;
        }

        /* Make KPI metric cards compact, responsive, and 100% readable */
        [data-testid="stMetricValue"] {
            font-size: 0.92rem !important;
            font-weight: 700 !important;
            line-height: 1.15 !important;
            color: #ffffff !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        [data-testid="stMetricLabel"] {
            font-size: 0.65rem !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            color: #94a3b8 !important;
            margin-bottom: 2px !important;
        }
        [data-testid="stMetricDelta"] {
            font-size: 0.60rem !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        [data-testid="stMetricDelta"] svg {
            width: 10px !important;
            height: 10px !important;
        }

        /* Clean subtle scrollbar for horizontal metric cards row */
        [data-testid="stHorizontalBlock"]::-webkit-scrollbar {
            height: 3px !important;
        }
        [data-testid="stHorizontalBlock"]::-webkit-scrollbar-track {
            background: transparent !important;
        }
        [data-testid="stHorizontalBlock"]::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.35) !important;
            border-radius: 3px !important;
        }

        /* Mobile typography - preventing clipping */
        h1 { 
            font-size: 1.35rem !important; 
            line-height: 1.3 !important;
            margin-top: 0.25rem !important;
            margin-bottom: 0.5rem !important;
            overflow: visible !important;
        }
        h2 { font-size: 1.2rem !important; }
        h3 { font-size: 1.05rem !important; }
        .stSelectbox { font-size: 0.9rem !important; }
    }

    /* Move Plotly modebar tools below charts so they never overlap data labels */
    .js-plotly-plot .plotly .modebar-container,
    .modebar-container {
        top: auto !important;
        bottom: 2px !important;
        right: 10px !important;
    }
    .modebar {
        background: rgba(15, 23, 42, 0.75) !important;
        border-radius: 6px !important;
        padding: 2px 6px !important;
    }
    .modebar-btn path {
        fill: rgba(255, 255, 255, 0.65) !important;
    }
    .modebar-btn:hover path {
        fill: #38bdf8 !important;
    }
    </style>
    """,
    unsafe_allow_html=True
)

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
    # Fetch subscriptions with address included
    subs = list(db.subscriptions.find({}, {"_id": 0, "amount": 1, "date": 1, "entityName": 1, "festOrEventName": 1, "paymentType": 1, "membershipType": 1, "address": 1}))
    df_subs = pd.DataFrame(subs)
    
    # Fetch expenses
    expenses = list(db.expenses.find({}, {"_id": 0, "amount": 1, "date": 1, "festOrEventName": 1, "entityName": 1}))
    df_exp = pd.DataFrame(expenses)

    # Fetch unique entities for the dropdowns
    entities_list = ["All Entities"] + (df_subs['entityName'].dropna().unique().tolist() if not df_subs.empty else [])

    return df_subs, df_exp, entities_list

df_subs, df_exp, entities_list = get_data()

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

# 1. FILTER BY ENTITY FIRST
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

# 2. GENERATE FESTIVALS LIST DYNAMICALLY BASED ON FILTERED DATA
festivals_list = ["All Festivals"] + (df_subs['festOrEventName'].dropna().unique().tolist() if not df_subs.empty else [])
selected_festival = st.sidebar.selectbox("Select Festival/Event", festivals_list)

# 3. FILTER BY FESTIVAL
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
        
        # Create a responsive Plotly Grouped Bar Chart
        df_plot_fin = pd.melt(
            df_financials,
            id_vars=['Year'],
            value_vars=['Subscription_Amount', 'Expenses'],
            var_name='Category',
            value_name='Amount'
        )
        df_plot_fin['Category'] = df_plot_fin['Category'].replace({
            'Subscription_Amount': 'Paid Subscriptions',
            'Expenses': 'Expenses'
        })
        df_plot_fin['Year_Str'] = df_plot_fin['Year'].astype(int).astype(str)
        df_plot_fin['Label'] = df_plot_fin['Amount'].apply(lambda v: f"₹{v:,.0f}")
        
        fig_fin = px.bar(
            df_plot_fin,
            x='Year_Str',
            y='Amount',
            color='Category',
            barmode='group',
            text='Label',
            color_discrete_map={
                'Paid Subscriptions': '#22C55E',
                'Expenses': '#EF4444'
            }
        )
        fig_fin.update_traces(
            textposition='outside',
            cliponaxis=False,
            textfont=dict(size=11, color='#FFFFFF'),
            hovertemplate="<b>%{x}</b><br>%{data.name}: ₹%{y:,.0f}<extra></extra>"
        )
        max_fin_val = df_plot_fin['Amount'].max()
        fig_fin.update_layout(
            xaxis_title="Year",
            yaxis_title="Amount (₹)",
            yaxis=dict(range=[0, max_fin_val * 1.2] if max_fin_val > 0 else [0, 1]),
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            ),
            margin=dict(t=30, b=45, l=10, r=20),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)'
        )
        st.plotly_chart(fig_fin, use_container_width=True, config={'displayModeBar': True, 'displaylogo': False})
    else:
        st.info("No financial data found for the selected filters.")
else:
    st.info("No financial data found in the database.")

st.divider()

# Clean and parse amount column safely for breakdown charts
if not df_subs.empty and 'amount' in df_subs.columns:
    df_subs['clean_amount'] = pd.to_numeric(
        df_subs['amount'].astype(str).str.replace(r'[^0-9.]', '', regex=True),
        errors='coerce'
    ).fillna(0)
elif not df_subs.empty:
    df_subs['clean_amount'] = 0

# ==========================================
# 5. PAYMENT STATUS (Paid, Due, Online)
# ==========================================
st.subheader("💳 User Payment Status")

if not df_subs.empty and 'paymentType' in df_subs.columns:
    payment_stats = df_subs.groupby('paymentType').agg(
        Count=('paymentType', 'count'),
        Total_Amount=('clean_amount', 'sum')
    ).reset_index()
    payment_stats.columns = ['Payment Type', 'Count', 'Total Amount']
    
    if not payment_stats.empty:
        total_payments = payment_stats['Count'].sum()
        payment_stats['Percentage'] = (payment_stats['Count'] / total_payments) * 100
        payment_stats['Label'] = payment_stats.apply(
            lambda r: f" ₹{r['Total Amount']:,.0f} • {r['Count']:,} ({r['Percentage']:.1f}%)", axis=1
        )
        
        # Summary KPI Metric Cards
        paid_row = payment_stats[payment_stats['Payment Type'] == 'Cash & Paid']
        online_row = payment_stats[payment_stats['Payment Type'] == 'Online']
        due_row = payment_stats[payment_stats['Payment Type'] == 'Due']
        
        pm1, pm2, pm3 = st.columns(3)
        paid_amt = paid_row['Total Amount'].values[0] if not paid_row.empty else 0
        paid_cnt = paid_row['Count'].values[0] if not paid_row.empty else 0
        pm1.metric("Cash & Paid", f"₹{paid_amt:,.0f}", f"{paid_cnt} users ({paid_cnt/total_payments*100:.1f}%)")
        
        online_amt = online_row['Total Amount'].values[0] if not online_row.empty else 0
        online_cnt = online_row['Count'].values[0] if not online_row.empty else 0
        pm2.metric("Online Payment", f"₹{online_amt:,.0f}", f"{online_cnt} users ({online_cnt/total_payments*100:.1f}%)")
        
        due_amt = due_row['Total Amount'].values[0] if not due_row.empty else 0
        due_cnt = due_row['Count'].values[0] if not due_row.empty else 0
        pm3.metric("Outstanding Due", f"₹{due_amt:,.0f}", f"{due_cnt} users ({due_cnt/total_payments*100:.1f}%)", delta_color="inverse")
        
        color_map = {
            'Cash & Paid': '#22C55E',       # Vibrant Green
            'Online': '#3B82F6',            # Vibrant Blue
            'Due': '#EF4444',               # Clear Alert Red
            'Coupon or Token': '#F59E0B'    # Amber
        }
        
        max_val = payment_stats['Count'].max()
        fig1 = px.bar(
            payment_stats, 
            x='Count', 
            y='Payment Type',
            orientation='h',
            text='Label',
            color='Payment Type',
            color_discrete_map=color_map,
            custom_data=['Count', 'Percentage', 'Total Amount']
        )
        fig1.update_traces(
            textposition='auto',
            cliponaxis=False,
            insidetextanchor='start',
            textfont=dict(size=12, color='#FFFFFF'),
            hovertemplate="<b>%{y}</b><br>Users: %{customdata[0]:,}<br>Share: %{customdata[1]:.1f}%<br>Total Amount: ₹%{customdata[2]:,.0f}<extra></extra>"
        )
        fig1.update_layout(
            showlegend=False,
            height=260,
            bargap=0.3,
            xaxis_title="Number of Users",
            yaxis_title="",
            xaxis=dict(range=[0, max_val * 1.15] if max_val > 0 else [0, 1]),
            yaxis={'categoryorder': 'total ascending'},
            margin=dict(t=15, b=45, l=10, r=20),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)'
        )
        
        st.plotly_chart(fig1, use_container_width=True, config={'displayModeBar': True, 'displaylogo': False})
    else:
        st.write("No payment data available.")
else:
    st.write("No payment data available.")

st.divider()

# ==========================================
# 6. USER TIER TYPES (None, Prime, VIP, Admin)
# ==========================================
st.subheader("⭐ User Tier Breakdown")

if not df_subs.empty and 'membershipType' in df_subs.columns:
    tier_stats = df_subs.groupby('membershipType').agg(
        Count=('membershipType', 'count'),
        Total_Amount=('clean_amount', 'sum')
    ).reset_index()
    tier_stats.columns = ['Tier Type', 'Count', 'Total Amount']
    
    if not tier_stats.empty:
        total_tiers = tier_stats['Count'].sum()
        tier_stats['Percentage'] = (tier_stats['Count'] / total_tiers) * 100
        tier_stats['Label'] = tier_stats.apply(
            lambda r: f" ₹{r['Total Amount']:,.0f} • {r['Count']:,} ({r['Percentage']:.1f}%)", axis=1
        )
        
        # Summary KPI Metric Cards for Tiers
        t1, t2, t3, t4 = st.columns(4)
        for col, tier_name, tier_icon in zip([t1, t2, t3, t4], ['Non-Prime', 'Prime', 'VIP', 'Admin'], ['👥', '⭐', '👑', '🛡️']):
            r = tier_stats[tier_stats['Tier Type'] == tier_name]
            cnt = r['Count'].values[0] if not r.empty else 0
            amt = r['Total Amount'].values[0] if not r.empty else 0
            pct = r['Percentage'].values[0] if not r.empty else 0
            col.metric(f"{tier_icon} {tier_name}", f"{cnt} users", f"₹{amt:,.0f} ({pct:.1f}%)")
        
        # Use high-contrast colors that work in both light and dark mode
        tier_color_map = {
            'Non-Prime': '#94A3B8',         # Slate
            'Prime': '#F59E0B',             # Gold/Amber
            'VIP': '#A855F7',               # Purple
            'Admin': '#EC4899',             # Pink / High contrast
            'Regular': '#3B82F6'            # Blue
        }
        
        max_tier_val = tier_stats['Count'].max()
        fig2 = px.bar(
            tier_stats, 
            x='Count', 
            y='Tier Type',
            orientation='h',
            text='Label',
            color='Tier Type',
            color_discrete_map=tier_color_map,
            custom_data=['Count', 'Percentage', 'Total Amount']
        )
        fig2.update_traces(
            textposition='auto',
            cliponaxis=False,
            insidetextanchor='start',
            textfont=dict(size=12, color='#FFFFFF'),
            hovertemplate="<b>%{y}</b><br>Users: %{customdata[0]:,}<br>Share: %{customdata[1]:.1f}%<br>Total Amount: ₹%{customdata[2]:,.0f}<extra></extra>"
        )
        fig2.update_layout(
            showlegend=False,
            height=260,
            bargap=0.3,
            xaxis_title="Number of Users",
            yaxis_title="",
            xaxis=dict(range=[0, max_tier_val * 1.15] if max_tier_val > 0 else [0, 1]),
            yaxis={'categoryorder': 'total ascending'},
            margin=dict(t=15, b=45, l=10, r=20),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)'
        )
        
        st.plotly_chart(fig2, use_container_width=True, config={'displayModeBar': True, 'displaylogo': False})
    else:
        st.write("No tier data available.")
else:
    st.write("No tier data available.")

st.divider()

# ==========================================
# 7. ADDRESS-WISE COLLECTION (Location Analysis)
# ==========================================
st.subheader("📍 Address-Wise Collection Analysis")
st.caption("Identify which locations and areas contribute the most revenue. Sorted by total amount collected.")

if not df_subs.empty:
    # Function to sanitize, normalize, and handle missing addresses
    def clean_address(val):
        if pd.isna(val) or val is None:
            return "NO FIXED ADDRESS"
        s = str(val).strip()
        if not s or s.lower() in ['none', 'nan', 'null', 'undefined', 'n/a', 'na', '-', 'no fixed address']:
            return "NO FIXED ADDRESS"
        # Normalize internal multiple spaces and Title Case
        return ' '.join(s.split()).title()

    if 'address' in df_subs.columns:
        df_subs['clean_address'] = df_subs['address'].apply(clean_address)
    else:
        df_subs['clean_address'] = "NO FIXED ADDRESS"

    # Group by address: calculate sum of amounts and user count
    addr_stats = df_subs.groupby('clean_address').agg(
        Total_Amount=('clean_amount', 'sum'),
        User_Count=('clean_address', 'count')
    ).reset_index()
    addr_stats.columns = ['Address', 'Total Amount', 'User Count']

    if not addr_stats.empty and addr_stats['Total Amount'].sum() > 0:
        total_collection_all = addr_stats['Total Amount'].sum()
        total_users_all = addr_stats['User Count'].sum()
        
        addr_stats['Percentage'] = (addr_stats['Total Amount'] / total_collection_all) * 100
        addr_stats = addr_stats.sort_values(by='Total Amount', ascending=False).reset_index(drop=True)

        # Summary KPI Cards
        top_addr_row = addr_stats.iloc[0]
        no_addr_row = addr_stats[addr_stats['Address'] == "NO FIXED ADDRESS"]
        no_addr_amt = no_addr_row['Total Amount'].values[0] if not no_addr_row.empty else 0
        no_addr_cnt = no_addr_row['User Count'].values[0] if not no_addr_row.empty else 0

        a1, a2, a3, a4 = st.columns(4)
        a1.metric("Total Locations", f"{len(addr_stats):,} areas")
        a2.metric("🏆 Top Location", f"{top_addr_row['Address']}", f"₹{top_addr_row['Total Amount']:,.0f} ({top_addr_row['Percentage']:.1f}%)")
        a3.metric("Avg Collection / Area", f"₹{total_collection_all / len(addr_stats):,.0f}", f"{total_users_all} total users")
        a4.metric("🏠 NO FIXED ADDRESS", f"₹{no_addr_amt:,.0f}", f"{no_addr_cnt} users ({no_addr_amt/total_collection_all*100:.1f}%)" if total_collection_all > 0 else "0 users")

        # View Limit Selector
        col_ctrl1, col_ctrl2 = st.columns([2, 2])
        with col_ctrl1:
            view_option = st.selectbox(
                "Display Locations",
                options=["Top 10 Highest Revenue", "Top 15 Highest Revenue", "Top 20 Highest Revenue", "All Locations"],
                index=0
            )

        if view_option == "Top 10 Highest Revenue":
            plot_addr = addr_stats.head(10).copy()
        elif view_option == "Top 15 Highest Revenue":
            plot_addr = addr_stats.head(15).copy()
        elif view_option == "Top 20 Highest Revenue":
            plot_addr = addr_stats.head(20).copy()
        else:
            plot_addr = addr_stats.copy()

        # Format label showing amount first (primary focus), then user count & percentage
        plot_addr['Label'] = plot_addr.apply(
            lambda r: f" ₹{r['Total Amount']:,.0f} • {r['User Count']:,} ({r['Percentage']:.1f}%)", axis=1
        )

        # Highlight 'NO FIXED ADDRESS' distinctly with coral, others with vibrant cyan/blue
        plot_addr['Bar_Color'] = plot_addr['Address'].apply(
            lambda x: '#F43F5E' if x == 'NO FIXED ADDRESS' else '#06B6D4'
        )

        max_addr_val = plot_addr['Total Amount'].max()

        # Create Plotly Horizontal Bar Chart
        fig_addr = px.bar(
            plot_addr,
            x='Total Amount',
            y='Address',
            orientation='h',
            text='Label',
            color='Bar_Color',
            color_discrete_map='identity',
            custom_data=['Total Amount', 'User Count', 'Percentage']
        )

        fig_addr.update_traces(
            textposition='auto',
            cliponaxis=False,
            insidetextanchor='start',
            textfont=dict(size=12, color='#FFFFFF'),
            hovertemplate="<b>%{y}</b><br>Total Collection: ₹%{customdata[0]:,.0f}<br>Users: %{customdata[1]:,}<br>Revenue Share: %{customdata[2]:.1f}%<extra></extra>"
        )

        chart_height = max(320, len(plot_addr) * 36)
        fig_addr.update_layout(
            showlegend=False,
            height=chart_height,
            bargap=0.28,
            xaxis_title="Total Amount Collected (₹)",
            yaxis_title="",
            xaxis=dict(range=[0, max_addr_val * 1.15] if max_addr_val > 0 else [0, 1]),
            yaxis={'categoryorder': 'total ascending'},
            margin=dict(t=15, b=50, l=10, r=20),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)'
        )

        st.plotly_chart(fig_addr, use_container_width=True, config={'displayModeBar': True, 'displaylogo': False})
    else:
        st.write("No collection data available by address.")
else:
    st.write("No address data available.")

# ==========================================
# AI PREDICTION PLACEHOLDER
# ==========================================
st.divider()
st.subheader("🤖 Future AI Predictions (Random Forest)")
st.write("The Random Forest Regressor is imported and ready. Once historical data is connected, this section will predict future subscription amounts based on past trends.")
