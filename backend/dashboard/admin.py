"""
Django admin configuration for Dashboard models.
"""

from django.contrib import admin
from .models import (
    Category, Product, Customer, Invoice, Transaction,
    DailySales, MonthlySales, GlobalSales, MarketValue,
    News, Notification, AccountInfo
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'color', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'category', 'price', 'units_sold', 'stock', 'source']
    list_filter = ['category', 'source', 'is_popular']
    search_fields = ['name', 'code']
    ordering = ['-units_sold']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'country', 'created_at']
    search_fields = ['name', 'email']
    list_filter = ['country']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer', 'product', 'total_price', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['invoice_number', 'customer__name', 'product__name']
    ordering = ['-created_at']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['title', 'amount', 'transaction_type', 'icon', 'created_at']
    list_filter = ['transaction_type', 'icon', 'category']
    search_fields = ['title', 'description']
    ordering = ['-created_at']


@admin.register(DailySales)
class DailySalesAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_revenue', 'total_orders', 'total_units']
    ordering = ['-date']


@admin.register(MonthlySales)
class MonthlySalesAdmin(admin.ModelAdmin):
    list_display = ['year', 'month', 'total_revenue', 'total_orders', 'total_units']
    ordering = ['-year', '-month']


@admin.register(GlobalSales)
class GlobalSalesAdmin(admin.ModelAdmin):
    list_display = ['country', 'country_code', 'total_revenue', 'percentage']
    ordering = ['-total_revenue']


@admin.register(MarketValue)
class MarketValueAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'value', 'volume']
    ordering = ['-timestamp']


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ['title', 'source', 'published_at']
    search_fields = ['title', 'snippet']
    ordering = ['-published_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']
    ordering = ['-created_at']


@admin.register(AccountInfo)
class AccountInfoAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_balance', 'plan_cost', 'taxes', 'extras']
