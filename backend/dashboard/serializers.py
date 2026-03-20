"""
Serializers for the Sales Dashboard API.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Avg
from .models import (
    Category, Product, Customer, Invoice, Transaction,
    DailySales, MonthlySales, GlobalSales, MarketValue,
    News, Notification, AccountInfo, Order, OrderItem
)


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'color', 'product_count', 'created_at']

    def get_product_count(self, obj):
        return obj.products.count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    stock_status = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'code', 'category', 'category_name', 'description',
            'price', 'discount', 'discounted_price', 'units_sold', 'stock',
            'stock_status', 'image_url', 'source', 'is_popular', 'created_at', 'updated_at'
        ]


class ProductListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_status = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'code', 'category', 'category_name', 'price',
            'discount', 'units_sold', 'stock', 'stock_status', 'source', 'image_url'
        ]


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products."""
    class Meta:
        model = Product
        fields = [
            'name', 'code', 'category', 'description', 'price',
            'discount', 'stock', 'image_url', 'source', 'is_popular'
        ]

    def create(self, validated_data):
        return Product.objects.create(**validated_data)


class CustomerSerializer(serializers.ModelSerializer):
    total_orders = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'address', 'city', 'country',
            'avatar_url', 'status', 'total_orders', 'total_spent', 'created_at'
        ]


class CustomerListSerializer(serializers.ModelSerializer):
    """Lighter serializer with computed fields."""
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'country', 'status',
            'total_orders', 'total_spent', 'created_at'
        ]

    def get_total_orders(self, obj):
        return obj.orders.count()

    def get_total_spent(self, obj):
        total = obj.orders.aggregate(total=Sum('items__total_price'))['total']
        return float(total) if total else 0


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with order history."""
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    recent_orders = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'address', 'city', 'country',
            'avatar_url', 'status', 'total_orders', 'total_spent',
            'recent_orders', 'created_at'
        ]

    def get_total_orders(self, obj):
        return obj.orders.count()

    def get_total_spent(self, obj):
        total = obj.orders.aggregate(total=Sum('items__total_price'))['total']
        return float(total) if total else 0

    def get_recent_orders(self, obj):
        orders = obj.orders.all()[:5]
        return OrderListSerializer(orders, many=True).data


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_code',
            'quantity', 'unit_price', 'total_price'
        ]


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'customer_name', 'customer_email',
            'status', 'shipping_address', 'shipping_city', 'shipping_country',
            'notes', 'items', 'total_amount', 'total_items', 'created_at', 'updated_at'
        ]


class OrderListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views."""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    total_amount = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'status',
            'total_amount', 'total_items', 'created_at'
        ]

    def get_total_amount(self, obj):
        total = obj.items.aggregate(total=Sum('total_price'))['total']
        return float(total) if total else 0

    def get_total_items(self, obj):
        total = obj.items.aggregate(total=Sum('quantity'))['total']
        return total if total else 0


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_address = serializers.CharField(source='customer.address', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name', 'customer_email',
            'customer_address', 'order', 'product', 'product_name', 'quantity',
            'unit_price', 'total_price', 'status', 'issue_date', 'due_date',
            'created_at', 'updated_at'
        ]


class InvoiceListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views."""
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer_name', 'total_price',
            'status', 'issue_date', 'due_date', 'created_at'
        ]


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'title', 'description', 'amount', 'transaction_type',
            'icon', 'category', 'category_name', 'invoice', 'created_at'
        ]


class DailySalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySales
        fields = ['id', 'date', 'total_revenue', 'total_orders', 'total_units']


class MonthlySalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlySales
        fields = ['id', 'year', 'month', 'total_revenue', 'total_orders', 'total_units']


class GlobalSalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSales
        fields = ['id', 'country', 'country_code', 'total_revenue', 'total_orders', 'percentage', 'flag_emoji']


class MarketValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketValue
        fields = ['id', 'timestamp', 'value', 'volume']


class NewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = ['id', 'title', 'snippet', 'content', 'image_url', 'source', 'published_at', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'created_at']


class AccountInfoSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AccountInfo
        fields = ['id', 'username', 'plan_cost', 'taxes', 'extras', 'total_balance', 'updated_at']


class KPISerializer(serializers.Serializer):
    """Serializer for KPI data."""
    revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    revenue_change = serializers.DecimalField(max_digits=5, decimal_places=2)
    sales_units = serializers.IntegerField()
    sales_units_change = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_orders = serializers.IntegerField()
    orders_today = serializers.IntegerField()
    orders_this_week = serializers.IntegerField()
    total_balance = serializers.DecimalField(max_digits=14, decimal_places=2)
    plan_cost = serializers.DecimalField(max_digits=10, decimal_places=2)
    taxes = serializers.DecimalField(max_digits=10, decimal_places=2)
    extras = serializers.DecimalField(max_digits=10, decimal_places=2)
    sparkline_data = serializers.ListField(child=serializers.DecimalField(max_digits=10, decimal_places=2))


class RevenueChartSerializer(serializers.Serializer):
    """Serializer for revenue chart data."""
    labels = serializers.ListField(child=serializers.CharField())
    this_period = serializers.ListField(child=serializers.DecimalField(max_digits=12, decimal_places=2))
    last_period = serializers.ListField(child=serializers.DecimalField(max_digits=12, decimal_places=2))


class CategorySalesSerializer(serializers.Serializer):
    """Serializer for category sales breakdown."""
    name = serializers.CharField()
    value = serializers.DecimalField(max_digits=12, decimal_places=2)
    color = serializers.CharField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class AnalyticsSummarySerializer(serializers.Serializer):
    """Serializer for analytics summary data."""
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_orders = serializers.IntegerField()
    conversion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    avg_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    return_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    revenue_by_category = serializers.ListField()
    sales_trend = serializers.ListField()
    top_products = serializers.ListField()
    customer_acquisition = serializers.ListField()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']
