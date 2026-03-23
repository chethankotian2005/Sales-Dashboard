"""
API Views for the Sales Dashboard.
"""

import csv
import json
import os
from datetime import datetime, timedelta
from decimal import Decimal
import random
import urllib.error
import urllib.request

from django.http import HttpResponse
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    Category, Product, Customer, Invoice, Transaction,
    DailySales, MonthlySales, GlobalSales, MarketValue,
    News, Notification, AccountInfo, Order, OrderItem
)
from .serializers import (
    CategorySerializer, ProductSerializer, ProductListSerializer, ProductCreateSerializer,
    CustomerSerializer, CustomerListSerializer, CustomerDetailSerializer,
    InvoiceSerializer, InvoiceListSerializer,
    TransactionSerializer, DailySalesSerializer, MonthlySalesSerializer,
    GlobalSalesSerializer, MarketValueSerializer, NewsSerializer,
    NotificationSerializer, AccountInfoSerializer, KPISerializer,
    RevenueChartSerializer, CategorySalesSerializer,
    OrderSerializer, OrderListSerializer, OrderItemSerializer,
    AnalyticsSummarySerializer, UserSerializer
)


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class SmallPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 50


class AIInsightsProxyView(APIView):
    """
    Proxy AI insights generation through backend to avoid browser CORS issues.
    POST /api/dashboard/ai-insights/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        api_key = request.data.get('apiKey') or os.environ.get('VITE_QWEN_API_KEY')
        kpi_data = request.data.get('kpiData', {})

        if not api_key:
            return Response({'detail': 'Missing API key'}, status=status.HTTP_400_BAD_REQUEST)

        is_nvidia_key = str(api_key).startswith('nvapi-')
        endpoint = (
            'https://integrate.api.nvidia.com/v1/chat/completions'
            if is_nvidia_key
            else 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
        )
        model = 'qwen/qwen3.5-122b-a10b' if is_nvidia_key else 'qwen-plus'

        payload = {
            'model': model,
            'stream': False,
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are a concise sales analyst. Respond only in bullet points. Never exceed 120 words.',
                },
                {
                    'role': 'user',
                    'content': (
                        'Analyze this sales data and give exactly 3 bullet-point insights '
                        'about trends/anomalies, then 1 actionable recommendation:\n\n'
                        + json.dumps(kpi_data, indent=2)
                    ),
                },
            ],
        }

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
            'Accept': 'application/json',
        }

        try:
            req = urllib.request.Request(
                endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers=headers,
                method='POST',
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                raw = resp.read().decode('utf-8')
                parsed = json.loads(raw)

            content = (
                parsed.get('choices', [{}])[0]
                .get('message', {})
                .get('content', '')
            )
            return Response({'content': content}, status=status.HTTP_200_OK)
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode('utf-8', errors='ignore')
            return Response(
                {
                    'detail': 'AI provider request failed',
                    'provider_status': exc.code,
                    'provider_body': error_body,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as exc:
            return Response(
                {'detail': f'Unexpected proxy error: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class KPIView(APIView):
    """
    API endpoint for dashboard KPI data.
    GET /api/dashboard/kpis/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = this_month_start - timedelta(days=1)
        week_start = today - timedelta(days=today.weekday())

        # This month revenue
        this_month_revenue = Invoice.objects.filter(
            created_at__date__gte=this_month_start,
            status__in=['paid', 'shipped', 'delivered']
        ).aggregate(total=Sum('total_price'))['total'] or Decimal('0')

        # Last month revenue for comparison
        last_month_revenue = Invoice.objects.filter(
            created_at__date__gte=last_month_start,
            created_at__date__lte=last_month_end,
            status__in=['paid', 'shipped', 'delivered']
        ).aggregate(total=Sum('total_price'))['total'] or Decimal('1')

        revenue_change = ((this_month_revenue - last_month_revenue) / last_month_revenue * 100) if last_month_revenue else 0

        # Sales units
        this_month_units = Invoice.objects.filter(
            created_at__date__gte=this_month_start
        ).aggregate(total=Sum('quantity'))['total'] or 0

        last_month_units = Invoice.objects.filter(
            created_at__date__gte=last_month_start,
            created_at__date__lte=last_month_end
        ).aggregate(total=Sum('quantity'))['total'] or 1

        units_change = ((this_month_units - last_month_units) / last_month_units * 100) if last_month_units else 0

        # Orders
        total_orders = Invoice.objects.count()
        orders_today = Invoice.objects.filter(created_at__date=today).count()
        orders_this_week = Invoice.objects.filter(created_at__date__gte=week_start).count()

        # Balance breakdown (from AccountInfo or calculated)
        try:
            account = AccountInfo.objects.first()
            if account:
                total_balance = account.total_balance
                plan_cost = account.plan_cost
                taxes = account.taxes
                extras = account.extras
            else:
                total_balance = this_month_revenue
                plan_cost = this_month_revenue * Decimal('0.7')
                taxes = this_month_revenue * Decimal('0.15')
                extras = this_month_revenue * Decimal('0.15')
        except:
            total_balance = this_month_revenue
            plan_cost = this_month_revenue * Decimal('0.7')
            taxes = this_month_revenue * Decimal('0.15')
            extras = this_month_revenue * Decimal('0.15')

        # Sparkline data (last 7 days revenue)
        sparkline_data = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_revenue = Invoice.objects.filter(
                created_at__date=day,
                status__in=['paid', 'shipped', 'delivered']
            ).aggregate(total=Sum('total_price'))['total'] or Decimal('0')
            sparkline_data.append(float(day_revenue))

        data = {
            'revenue': float(this_month_revenue),
            'revenue_change': float(revenue_change),
            'sales_units': this_month_units,
            'sales_units_change': float(units_change),
            'total_orders': total_orders,
            'orders_today': orders_today,
            'orders_this_week': orders_this_week,
            'total_balance': float(total_balance),
            'plan_cost': float(plan_cost),
            'taxes': float(taxes),
            'extras': float(extras),
            'sparkline_data': sparkline_data,
        }

        return Response(data)


class RevenueChartView(APIView):
    """
    API endpoint for revenue chart data.
    GET /api/dashboard/revenue/?period=week|month
    """
    permission_classes = [AllowAny]

    def get(self, request):
        period = request.query_params.get('period', 'week')
        today = timezone.now().date()

        if period == 'week':
            # This week vs last week
            this_week_start = today - timedelta(days=today.weekday())
            last_week_start = this_week_start - timedelta(days=7)
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

            this_period = []
            last_period = []

            for i in range(7):
                this_day = this_week_start + timedelta(days=i)
                last_day = last_week_start + timedelta(days=i)

                this_revenue = Invoice.objects.filter(
                    created_at__date=this_day,
                    status__in=['paid', 'shipped', 'delivered']
                ).aggregate(total=Sum('total_price'))['total'] or 0

                last_revenue = Invoice.objects.filter(
                    created_at__date=last_day,
                    status__in=['paid', 'shipped', 'delivered']
                ).aggregate(total=Sum('total_price'))['total'] or 0

                this_period.append(float(this_revenue))
                last_period.append(float(last_revenue))

        else:  # month
            # This month vs last month
            this_month_start = today.replace(day=1)
            last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)

            labels = [f'Week {i+1}' for i in range(4)]
            this_period = []
            last_period = []

            for week in range(4):
                this_week_start = this_month_start + timedelta(days=week * 7)
                this_week_end = this_week_start + timedelta(days=6)
                last_week_start = last_month_start + timedelta(days=week * 7)
                last_week_end = last_week_start + timedelta(days=6)

                this_revenue = Invoice.objects.filter(
                    created_at__date__gte=this_week_start,
                    created_at__date__lte=this_week_end,
                    status__in=['paid', 'shipped', 'delivered']
                ).aggregate(total=Sum('total_price'))['total'] or 0

                last_revenue = Invoice.objects.filter(
                    created_at__date__gte=last_week_start,
                    created_at__date__lte=last_week_end,
                    status__in=['paid', 'shipped', 'delivered']
                ).aggregate(total=Sum('total_price'))['total'] or 0

                this_period.append(float(this_revenue))
                last_period.append(float(last_revenue))

        return Response({
            'labels': labels,
            'this_period': this_period,
            'last_period': last_period,
        })


class DailySalesView(APIView):
    """
    API endpoint for daily sales bar chart.
    GET /api/dashboard/daily-sales/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        today = timezone.now().date()

        data = []
        for i in range(days - 1, -1, -1):
            day = today - timedelta(days=i)
            daily_sale = DailySales.objects.filter(date=day).first()

            if daily_sale:
                data.append({
                    'date': day.strftime('%a'),
                    'full_date': day.isoformat(),
                    'revenue': float(daily_sale.total_revenue),
                    'orders': daily_sale.total_orders,
                    'units': daily_sale.total_units,
                })
            else:
                # Calculate from invoices if DailySales doesn't exist
                revenue = Invoice.objects.filter(
                    created_at__date=day,
                    status__in=['paid', 'shipped', 'delivered']
                ).aggregate(total=Sum('total_price'))['total'] or 0

                orders = Invoice.objects.filter(created_at__date=day).count()
                units = Invoice.objects.filter(created_at__date=day).aggregate(
                    total=Sum('quantity')
                )['total'] or 0

                data.append({
                    'date': day.strftime('%a'),
                    'full_date': day.isoformat(),
                    'revenue': float(revenue),
                    'orders': orders,
                    'units': units,
                })

        return Response(data)


class CategorySalesView(APIView):
    """
    API endpoint for category sales breakdown (donut chart).
    GET /api/dashboard/category-sales/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        total_revenue = Invoice.objects.filter(
            status__in=['paid', 'shipped', 'delivered']
        ).aggregate(total=Sum('total_price'))['total'] or Decimal('1')

        data = []
        for category in categories:
            category_revenue = Invoice.objects.filter(
                product__category=category,
                status__in=['paid', 'shipped', 'delivered']
            ).aggregate(total=Sum('total_price'))['total'] or Decimal('0')

            percentage = (category_revenue / total_revenue * 100) if total_revenue else 0

            data.append({
                'name': category.name,
                'value': float(category_revenue),
                'color': category.color,
                'percentage': float(percentage),
            })

        return Response({
            'categories': data,
            'total': float(total_revenue),
        })


class TransactionViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for transactions.
    GET /api/dashboard/transactions/
    """
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['transaction_type', 'icon', 'category']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'amount']


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for invoices.
    GET /api/dashboard/invoices/
    """
    queryset = Invoice.objects.select_related('customer', 'product')
    serializer_class = InvoiceSerializer
    permission_classes = [AllowAny]
    pagination_class = SmallPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['invoice_number', 'customer__name', 'product__name']
    ordering_fields = ['created_at', 'total_price', 'status']

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export invoices as CSV."""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="invoices.csv"'

        writer = csv.writer(response)
        writer.writerow(['Invoice #', 'Customer', 'Product', 'Quantity', 'Unit Price', 'Total', 'Status', 'Date'])

        invoices = self.get_queryset()
        for invoice in invoices:
            writer.writerow([
                invoice.invoice_number,
                invoice.customer.name,
                invoice.product.name,
                invoice.quantity,
                invoice.unit_price,
                invoice.total_price,
                invoice.status,
                invoice.created_at.strftime('%Y-%m-%d'),
            ])

        return response


class ProductViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for products.
    """
    queryset = Product.objects.select_related('category')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'source', 'is_popular']
    search_fields = ['name', 'code']
    ordering_fields = ['units_sold', 'price', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    @action(detail=False, methods=['get'])
    def top(self, request):
        """Get top selling products."""
        limit = int(request.query_params.get('limit', 10))
        products = Product.objects.order_by('-units_sold')[:limit]
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular products."""
        products = Product.objects.filter(is_popular=True)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export products as CSV."""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="products.csv"'

        writer = csv.writer(response)
        writer.writerow(['Name', 'Code', 'Category', 'Price', 'Discount', 'Units Sold', 'Stock', 'Source'])

        products = self.get_queryset()
        for product in products:
            writer.writerow([
                product.name,
                product.code,
                product.category.name,
                product.price,
                f"{product.discount}%",
                product.units_sold,
                product.stock,
                product.source,
            ])

        return response


class GlobalSalesView(APIView):
    """
    API endpoint for global sales by country.
    GET /api/dashboard/global-sales/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        global_sales = GlobalSales.objects.all()[:10]
        serializer = GlobalSalesSerializer(global_sales, many=True)
        return Response(serializer.data)


class MarketValueView(APIView):
    """
    API endpoint for market value time series.
    GET /api/dashboard/market-value/?range=year|month|day
    """
    permission_classes = [AllowAny]

    def get(self, request):
        range_param = request.query_params.get('range', 'month')
        now = timezone.now()

        if range_param == 'day':
            # Last 24 hours, hourly data
            start_time = now - timedelta(hours=24)
            values = MarketValue.objects.filter(timestamp__gte=start_time).order_by('timestamp')
        elif range_param == 'year':
            # Last 12 months
            start_time = now - timedelta(days=365)
            values = MarketValue.objects.filter(timestamp__gte=start_time).order_by('timestamp')
        else:  # month
            # Last 30 days
            start_time = now - timedelta(days=30)
            values = MarketValue.objects.filter(timestamp__gte=start_time).order_by('timestamp')

        serializer = MarketValueSerializer(values, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Simulate real-time update with slight random variation."""
        latest = MarketValue.objects.order_by('-timestamp').first()
        if latest:
            variation = Decimal(str(random.uniform(-0.05, 0.05)))
            new_value = latest.value * (1 + variation)
            new_volume = int(latest.volume * random.uniform(0.9, 1.1))
        else:
            new_value = Decimal('1000.00')
            new_volume = 10000

        market_value = MarketValue.objects.create(
            timestamp=timezone.now(),
            value=new_value,
            volume=new_volume
        )
        serializer = MarketValueSerializer(market_value)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NewsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API ViewSet for news and updates.
    GET /api/dashboard/news/
    """
    queryset = News.objects.all()
    serializer_class = NewsSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'snippet']
    ordering_fields = ['published_at']

    def get_queryset(self):
        queryset = News.objects.all()
        filter_param = self.request.query_params.get('filter', None)
        today = timezone.now().date()

        if filter_param == 'today':
            queryset = queryset.filter(published_at__date=today)
        elif filter_param == 'yesterday':
            queryset = queryset.filter(published_at__date=today - timedelta(days=1))
        elif filter_param == 'tomorrow':
            queryset = queryset.filter(published_at__date=today + timedelta(days=1))

        return queryset


class NotificationViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for user notifications.
    GET /api/dashboard/notifications/
    """
    serializer_class = NotificationSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Notification.objects.filter(user=self.request.user)
        return Notification.objects.all()

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        if request.user.is_authenticated:
            count = Notification.objects.filter(user=request.user, is_read=False).count()
        else:
            count = Notification.objects.filter(is_read=False).count()
        return Response({'count': count})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        if request.user.is_authenticated:
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        else:
            Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'success'})


class AccountInfoView(APIView):
    """
    API endpoint for account information.
    GET /api/dashboard/account/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            account, created = AccountInfo.objects.get_or_create(
                user=request.user,
                defaults={
                    'plan_cost': Decimal('299.00'),
                    'taxes': Decimal('45.00'),
                    'extras': Decimal('25.00'),
                    'total_balance': Decimal('369.00'),
                }
            )
        else:
            account = AccountInfo.objects.first()
            if not account:
                return Response({
                    'plan_cost': 299.00,
                    'taxes': 45.00,
                    'extras': 25.00,
                    'total_balance': 369.00,
                })

        serializer = AccountInfoSerializer(account)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for categories.
    GET /api/dashboard/categories/
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']


class CustomerViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for customers.
    GET /api/dashboard/customers/
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'country']
    search_fields = ['name', 'email', 'phone']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        if self.action == 'retrieve':
            return CustomerDetailSerializer
        return CustomerSerializer

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export customers as CSV."""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="customers.csv"'

        writer = csv.writer(response)
        writer.writerow(['Name', 'Email', 'Phone', 'Country', 'Status', 'Total Orders', 'Created'])

        customers = self.get_queryset()
        for customer in customers:
            writer.writerow([
                customer.name,
                customer.email,
                customer.phone,
                customer.country,
                customer.status,
                customer.orders.count(),
                customer.created_at.strftime('%Y-%m-%d'),
            ])

        return response


class OrderViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for orders.
    GET /api/dashboard/orders/
    """
    queryset = Order.objects.select_related('customer').prefetch_related('items__product')
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'status': ['exact'],
        'customer': ['exact'],
        'created_at': ['date__gte', 'date__lte'],
    }
    search_fields = ['order_number', 'customer__name', 'customer__email']
    ordering_fields = ['created_at', 'status']

    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        return OrderSerializer

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update order status."""
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status in dict(Order.STATUS_CHOICES):
            order.status = new_status
            order.save()
            return Response({'status': 'success', 'new_status': new_status})
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export orders as CSV."""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="orders.csv"'

        writer = csv.writer(response)
        writer.writerow(['Order #', 'Customer', 'Status', 'Total Items', 'Total Amount', 'Created'])

        orders = self.get_queryset()
        for order in orders:
            writer.writerow([
                order.order_number,
                order.customer.name,
                order.status,
                order.total_items,
                order.total_amount,
                order.created_at.strftime('%Y-%m-%d %H:%M'),
            ])

        return response


class AnalyticsView(APIView):
    """
    API endpoint for analytics summary data.
    GET /api/dashboard/analytics/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        last_30_days = today - timedelta(days=30)

        # Total revenue
        total_revenue = Invoice.objects.filter(
            status__in=['paid', 'shipped', 'delivered']
        ).aggregate(total=Sum('total_price'))['total'] or Decimal('0')

        # Total orders
        total_orders = Order.objects.count()

        # Average order value
        avg_order = Order.objects.annotate(
            order_total=Sum('items__total_price')
        ).aggregate(avg=Avg('order_total'))['avg'] or Decimal('0')

        # Conversion rate (simulated - orders / visitors)
        conversion_rate = Decimal('3.45')

        # Return rate (simulated)
        return_rate = Decimal('2.1')

        # Revenue by category
        categories = Category.objects.all()
        revenue_by_category = []
        for category in categories:
            cat_revenue = Invoice.objects.filter(
                product__category=category,
                status__in=['paid', 'shipped', 'delivered']
            ).aggregate(total=Sum('total_price'))['total'] or Decimal('0')
            revenue_by_category.append({
                'name': category.name,
                'value': float(cat_revenue),
                'color': category.color,
            })

        # Sales trend (last 30 days)
        sales_trend = []
        for i in range(29, -1, -1):
            day = today - timedelta(days=i)
            day_revenue = Invoice.objects.filter(
                created_at__date=day,
                status__in=['paid', 'shipped', 'delivered']
            ).aggregate(total=Sum('total_price'))['total'] or Decimal('0')
            sales_trend.append({
                'date': day.isoformat(),
                'revenue': float(day_revenue),
            })

        # Top products
        top_products = Product.objects.order_by('-units_sold')[:10]
        top_products_data = [
            {
                'id': p.id,
                'name': p.name,
                'units_sold': p.units_sold,
                'revenue': float(p.price * p.units_sold),
            }
            for p in top_products
        ]

        # Customer acquisition (last 6 months)
        customer_acquisition = []
        for i in range(5, -1, -1):
            month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            new_customers = Customer.objects.filter(
                created_at__date__gte=month_start,
                created_at__date__lte=month_end
            ).count()
            customer_acquisition.append({
                'month': month_start.strftime('%b %Y'),
                'customers': new_customers,
            })

        data = {
            'total_revenue': float(total_revenue),
            'total_orders': total_orders,
            'conversion_rate': float(conversion_rate),
            'avg_order_value': float(avg_order),
            'return_rate': float(return_rate),
            'revenue_by_category': revenue_by_category,
            'sales_trend': sales_trend,
            'top_products': top_products_data,
            'customer_acquisition': customer_acquisition,
        }

        return Response(data)


class UserProfileView(APIView):
    """
    API endpoint for user profile management.
    GET/PUT /api/dashboard/profile/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            user = request.user
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined,
            })
        return Response({
            'username': 'demo',
            'email': 'demo@example.com',
            'first_name': 'Demo',
            'last_name': 'User',
        })

    def put(self, request):
        if request.user.is_authenticated:
            user = request.user
            user.first_name = request.data.get('first_name', user.first_name)
            user.last_name = request.data.get('last_name', user.last_name)
            user.email = request.data.get('email', user.email)
            user.save()
            return Response({'status': 'success'})
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
