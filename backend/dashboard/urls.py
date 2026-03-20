"""
URL configuration for Dashboard API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    KPIView, RevenueChartView, DailySalesView, CategorySalesView,
    TransactionViewSet, InvoiceViewSet, ProductViewSet,
    GlobalSalesView, MarketValueView, NewsViewSet,
    NotificationViewSet, AccountInfoView, CategoryViewSet,
    CustomerViewSet, OrderViewSet, AnalyticsView, UserProfileView
)

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'news', NewsViewSet, basename='news')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('kpis/', KPIView.as_view(), name='kpis'),
    path('revenue/', RevenueChartView.as_view(), name='revenue'),
    path('daily-sales/', DailySalesView.as_view(), name='daily-sales'),
    path('category-sales/', CategorySalesView.as_view(), name='category-sales'),
    path('global-sales/', GlobalSalesView.as_view(), name='global-sales'),
    path('market-value/', MarketValueView.as_view(), name='market-value'),
    path('account/', AccountInfoView.as_view(), name='account'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('profile/', UserProfileView.as_view(), name='profile'),
]
