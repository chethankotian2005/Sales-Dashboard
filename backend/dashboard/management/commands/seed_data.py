"""
Management command to seed the database with realistic fake data.
"""

import random
from decimal import Decimal
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone

from faker import Faker

from dashboard.models import (
    Category, Product, Customer, Invoice, Transaction,
    DailySales, MonthlySales, GlobalSales, MarketValue,
    News, Notification, AccountInfo, Order, OrderItem
)


fake = Faker()


class Command(BaseCommand):
    help = 'Seed the database with realistic fake data for the sales dashboard'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            self.clear_data()

        self.stdout.write('Seeding database...')

        self.create_users()
        self.create_categories()
        self.create_products()
        self.create_customers()
        self.create_orders()
        self.create_invoices()
        self.create_transactions()
        self.create_daily_sales()
        self.create_monthly_sales()
        self.create_global_sales()
        self.create_market_values()
        self.create_news()
        self.create_notifications()
        self.create_account_info()

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))

    def clear_data(self):
        """Clear all existing data."""
        models = [
            AccountInfo, Notification, News, MarketValue,
            GlobalSales, MonthlySales, DailySales, Transaction,
            OrderItem, Order, Invoice, Customer, Product, Category
        ]
        for model in models:
            model.objects.all().delete()

    def create_users(self):
        """Create admin and demo users."""
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123',
                first_name='Admin',
                last_name='User'
            )
            self.stdout.write('  Created admin user')

        if not User.objects.filter(username='demo').exists():
            User.objects.create_user(
                username='demo',
                email='demo@example.com',
                password='demo123',
                first_name='Demo',
                last_name='User'
            )
            self.stdout.write('  Created demo user')

    def create_categories(self):
        """Create product categories."""
        categories_data = [
            {'name': 'Electronics', 'slug': 'electronics', 'color': '#4361ee'},
            {'name': 'Apparel', 'slug': 'apparel', 'color': '#7209b7'},
            {'name': 'Accessories', 'slug': 'accessories', 'color': '#f72585'},
            {'name': 'Home & Garden', 'slug': 'home-garden', 'color': '#4cc9f0'},
            {'name': 'Sports', 'slug': 'sports', 'color': '#2ecc71'},
        ]

        for cat_data in categories_data:
            Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
        self.stdout.write(f'  Created {len(categories_data)} categories')

    def create_products(self):
        """Create 50 products across categories."""
        categories = list(Category.objects.all())
        sources = ['google', 'direct', 'email', 'referral', 'social']

        product_templates = {
            'electronics': [
                'Wireless Headphones', 'Smart Watch', 'Bluetooth Speaker',
                'Laptop Stand', 'USB Hub', 'Webcam HD', 'Mechanical Keyboard',
                'Gaming Mouse', 'Monitor Light', 'Power Bank'
            ],
            'apparel': [
                'Cotton T-Shirt', 'Denim Jacket', 'Running Shoes', 'Wool Sweater',
                'Casual Pants', 'Summer Dress', 'Winter Coat', 'Sports Cap',
                'Leather Belt', 'Silk Scarf'
            ],
            'accessories': [
                'Leather Wallet', 'Sunglasses', 'Wrist Watch', 'Silver Necklace',
                'Phone Case', 'Laptop Bag', 'Travel Backpack', 'Card Holder',
                'Key Chain', 'Hair Clips Set'
            ],
            'home-garden': [
                'Plant Pot Set', 'LED Lamp', 'Throw Pillow', 'Wall Art',
                'Scented Candle', 'Coffee Table Book', 'Ceramic Vase',
                'Kitchen Timer', 'Door Mat', 'Garden Tools'
            ],
            'sports': [
                'Yoga Mat', 'Resistance Bands', 'Jump Rope', 'Foam Roller',
                'Water Bottle', 'Gym Bag', 'Tennis Racket', 'Basketball',
                'Cycling Gloves', 'Swimming Goggles'
            ],
        }

        count = 0
        for category in categories:
            templates = product_templates.get(category.slug, ['Generic Product'])
            for i, name in enumerate(templates):
                code = f"{category.slug[:3].upper()}-{str(i + 1).zfill(4)}"
                if not Product.objects.filter(code=code).exists():
                    Product.objects.create(
                        name=name,
                        code=code,
                        category=category,
                        price=Decimal(str(random.uniform(19.99, 499.99))).quantize(Decimal('0.01')),
                        discount=Decimal(str(random.choice([0, 5, 10, 15, 20, 25]))),
                        units_sold=random.randint(50, 5000),
                        stock=random.randint(10, 500),
                        source=random.choice(sources),
                        is_popular=random.random() > 0.7,
                    )
                    count += 1

        self.stdout.write(f'  Created {count} products')

    def create_customers(self):
        """Create 100 customers."""
        countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'France', 'Japan', 'Brazil']

        for i in range(100):
            email = fake.unique.email()
            if not Customer.objects.filter(email=email).exists():
                Customer.objects.create(
                    name=fake.name(),
                    email=email,
                    phone=fake.phone_number()[:20],
                    address=fake.address(),
                    country=random.choice(countries),
                )

        self.stdout.write(f'  Created {Customer.objects.count()} customers')

    def create_orders(self):
        """Create 50 orders with items."""
        customers = list(Customer.objects.all())
        products = list(Product.objects.all())
        statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        status_weights = [0.15, 0.20, 0.20, 0.35, 0.10]
        countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany']

        now = timezone.now()

        for i in range(50):
            order_number = f"ORD-{str(i + 1).zfill(6)}"
            if not Order.objects.filter(order_number=order_number).exists():
                customer = random.choice(customers)
                days_ago = random.randint(0, 90)
                created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))

                order = Order(
                    order_number=order_number,
                    customer=customer,
                    status=random.choices(statuses, weights=status_weights)[0],
                    shipping_address=fake.street_address(),
                    shipping_city=fake.city(),
                    shipping_country=random.choice(countries),
                    notes=fake.sentence() if random.random() > 0.5 else '',
                )
                order.save()
                Order.objects.filter(pk=order.pk).update(created_at=created_at)

                # Add 1-4 items per order
                num_items = random.randint(1, 4)
                order_products = random.sample(products, min(num_items, len(products)))
                for product in order_products:
                    quantity = random.randint(1, 3)
                    unit_price = product.discounted_price
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=unit_price * quantity,
                    )

        self.stdout.write(f'  Created {Order.objects.count()} orders with {OrderItem.objects.count()} items')

    def create_invoices(self):
        """Create 100 invoices with varied statuses."""
        customers = list(Customer.objects.all())
        products = list(Product.objects.all())
        statuses = ['pending', 'paid', 'overdue', 'cancelled']
        status_weights = [0.20, 0.45, 0.25, 0.10]

        now = timezone.now()

        for i in range(100):
            invoice_number = f"INV-{str(i + 1).zfill(6)}"
            if not Invoice.objects.filter(invoice_number=invoice_number).exists():
                customer = random.choice(customers)
                product = random.choice(products)
                quantity = random.randint(1, 5)
                unit_price = product.discounted_price

                # Random date within last 90 days
                days_ago = random.randint(0, 90)
                created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))
                issue_date = (now - timedelta(days=days_ago)).date()
                due_date = issue_date + timedelta(days=random.choice([15, 30, 45, 60]))

                invoice_status = random.choices(statuses, weights=status_weights)[0]
                # If due_date is past and status is pending, make it overdue
                if due_date < now.date() and invoice_status == 'pending':
                    invoice_status = 'overdue'

                invoice = Invoice(
                    invoice_number=invoice_number,
                    customer=customer,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=unit_price * quantity,
                    status=invoice_status,
                    issue_date=issue_date,
                    due_date=due_date,
                )
                invoice.save()
                # Update created_at after save
                Invoice.objects.filter(pk=invoice.pk).update(created_at=created_at)

        self.stdout.write(f'  Created {Invoice.objects.count()} invoices')

    def create_transactions(self):
        """Create 500 transactions over 12 months."""
        categories = list(Category.objects.all())
        icons = ['shopping', 'transfer', 'subscription', 'food', 'transport',
                 'entertainment', 'utilities', 'salary', 'refund', 'other']

        income_titles = [
            'Product Sale', 'Service Payment', 'Subscription Revenue',
            'Affiliate Commission', 'Refund Reversal', 'Partner Payment'
        ]
        expense_titles = [
            'Supplier Payment', 'Marketing Expense', 'Server Costs',
            'Office Supplies', 'Staff Salary', 'Shipping Costs',
            'Software License', 'Advertising', 'Utilities Bill'
        ]

        now = timezone.now()

        for i in range(500):
            is_income = random.random() > 0.35
            days_ago = random.randint(0, 365)
            created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23))

            if is_income:
                title = random.choice(income_titles)
                amount = Decimal(str(random.uniform(100, 5000))).quantize(Decimal('0.01'))
                icon = random.choice(['shopping', 'transfer', 'refund', 'salary'])
            else:
                title = random.choice(expense_titles)
                amount = Decimal(str(random.uniform(50, 2000))).quantize(Decimal('0.01'))
                icon = random.choice(icons)

            transaction = Transaction(
                title=title,
                description=fake.sentence(),
                amount=amount,
                transaction_type='income' if is_income else 'expense',
                icon=icon,
                category=random.choice(categories) if random.random() > 0.3 else None,
            )
            transaction.save()
            Transaction.objects.filter(pk=transaction.pk).update(created_at=created_at)

        self.stdout.write(f'  Created {Transaction.objects.count()} transactions')

    def create_daily_sales(self):
        """Create daily sales for last 90 days."""
        today = timezone.now().date()

        for i in range(90):
            date = today - timedelta(days=i)
            if not DailySales.objects.filter(date=date).exists():
                # Calculate from invoices if they exist
                from django.db.models import Sum
                invoices = Invoice.objects.filter(
                    created_at__date=date,
                    status__in=['paid', 'shipped', 'delivered']
                )

                revenue = invoices.aggregate(total=Sum('total_price'))['total'] or Decimal(str(random.uniform(1000, 15000)))
                orders = invoices.count() or random.randint(5, 50)
                units = invoices.aggregate(total=Sum('quantity'))['total'] or random.randint(10, 100)

                DailySales.objects.create(
                    date=date,
                    total_revenue=revenue if isinstance(revenue, Decimal) else Decimal(str(revenue)).quantize(Decimal('0.01')),
                    total_orders=orders,
                    total_units=units,
                )

        self.stdout.write(f'  Created {DailySales.objects.count()} daily sales records')

    def create_monthly_sales(self):
        """Create monthly sales for last 12 months."""
        now = timezone.now()

        for i in range(12):
            month_date = now - timedelta(days=i * 30)
            year = month_date.year
            month = month_date.month

            if not MonthlySales.objects.filter(year=year, month=month).exists():
                MonthlySales.objects.create(
                    year=year,
                    month=month,
                    total_revenue=Decimal(str(random.uniform(30000, 150000))).quantize(Decimal('0.01')),
                    total_orders=random.randint(100, 500),
                    total_units=random.randint(200, 1000),
                )

        self.stdout.write(f'  Created {MonthlySales.objects.count()} monthly sales records')

    def create_global_sales(self):
        """Create global sales by country."""
        countries_data = [
            {'country': 'United States', 'code': 'USA', 'flag': '🇺🇸', 'weight': 0.35},
            {'country': 'United Kingdom', 'code': 'GBR', 'flag': '🇬🇧', 'weight': 0.15},
            {'country': 'Germany', 'code': 'DEU', 'flag': '🇩🇪', 'weight': 0.12},
            {'country': 'Australia', 'code': 'AUS', 'flag': '🇦🇺', 'weight': 0.10},
            {'country': 'Canada', 'code': 'CAN', 'flag': '🇨🇦', 'weight': 0.08},
            {'country': 'France', 'code': 'FRA', 'flag': '🇫🇷', 'weight': 0.07},
            {'country': 'Japan', 'code': 'JPN', 'flag': '🇯🇵', 'weight': 0.06},
            {'country': 'Brazil', 'code': 'BRA', 'flag': '🇧🇷', 'weight': 0.04},
            {'country': 'India', 'code': 'IND', 'flag': '🇮🇳', 'weight': 0.02},
            {'country': 'Other', 'code': 'OTH', 'flag': '🌍', 'weight': 0.01},
        ]

        total_global = Decimal('500000.00')

        for data in countries_data:
            if not GlobalSales.objects.filter(country_code=data['code']).exists():
                revenue = total_global * Decimal(str(data['weight']))
                GlobalSales.objects.create(
                    country=data['country'],
                    country_code=data['code'],
                    total_revenue=revenue.quantize(Decimal('0.01')),
                    total_orders=int(500 * data['weight']),
                    percentage=Decimal(str(data['weight'] * 100)),
                    flag_emoji=data['flag'],
                )

        self.stdout.write(f'  Created {GlobalSales.objects.count()} global sales records')

    def create_market_values(self):
        """Create market value time series data."""
        now = timezone.now()
        base_value = Decimal('1000.00')

        # Create hourly data for last 30 days
        for i in range(720):  # 30 days * 24 hours
            timestamp = now - timedelta(hours=i)

            # Simulate market fluctuation
            trend = Decimal(str(0.0001 * (720 - i)))  # Slight upward trend
            noise = Decimal(str(random.uniform(-0.02, 0.02)))
            value = base_value * (1 + trend + noise)

            MarketValue.objects.create(
                timestamp=timestamp,
                value=value.quantize(Decimal('0.01')),
                volume=random.randint(5000, 50000),
            )

        self.stdout.write(f'  Created {MarketValue.objects.count()} market value records')

    def create_news(self):
        """Create news articles."""
        news_data = [
            {
                'title': 'Q4 Sales Exceed Expectations by 23%',
                'snippet': 'Our fourth quarter sales have exceeded projections, driven by strong performance in electronics and apparel categories.',
                'source': 'Internal Report',
                'days_ago': 0,
            },
            {
                'title': 'New Partnership Announced with Global Retailer',
                'snippet': 'We are excited to announce a strategic partnership that will expand our market reach to 15 new countries.',
                'source': 'Press Release',
                'days_ago': 1,
            },
            {
                'title': 'Customer Satisfaction Scores Hit All-Time High',
                'snippet': 'Our latest survey shows customer satisfaction at 94%, the highest in company history.',
                'source': 'Customer Success',
                'days_ago': 2,
            },
            {
                'title': 'New Product Line Launch Next Month',
                'snippet': 'Get ready for our most innovative product line yet, featuring sustainable materials and cutting-edge design.',
                'source': 'Product Team',
                'days_ago': -1,  # Tomorrow
            },
            {
                'title': 'Holiday Season Preparation Underway',
                'snippet': 'Teams are working around the clock to ensure we are ready for the upcoming holiday shopping season.',
                'source': 'Operations',
                'days_ago': 3,
            },
        ]

        now = timezone.now()

        for data in news_data:
            News.objects.create(
                title=data['title'],
                snippet=data['snippet'],
                content=fake.paragraph(nb_sentences=5),
                source=data['source'],
                published_at=now - timedelta(days=data['days_ago']),
            )

        self.stdout.write(f'  Created {News.objects.count()} news articles')

    def create_notifications(self):
        """Create notifications for users."""
        users = User.objects.all()
        notification_data = [
            {'title': 'New Order Received', 'message': 'You have received a new order #INV-000123', 'type': 'info'},
            {'title': 'Payment Successful', 'message': 'Payment of $1,250.00 has been processed successfully', 'type': 'success'},
            {'title': 'Low Stock Alert', 'message': 'Product "Wireless Headphones" is running low on stock', 'type': 'warning'},
            {'title': 'System Maintenance', 'message': 'Scheduled maintenance will occur tonight at 2 AM', 'type': 'info'},
            {'title': 'Monthly Report Ready', 'message': 'Your monthly sales report is ready for download', 'type': 'success'},
        ]

        for user in users:
            for data in notification_data:
                Notification.objects.create(
                    user=user,
                    title=data['title'],
                    message=data['message'],
                    notification_type=data['type'],
                    is_read=random.random() > 0.5,
                )

        self.stdout.write(f'  Created {Notification.objects.count()} notifications')

    def create_account_info(self):
        """Create account info for users."""
        users = User.objects.all()

        for user in users:
            if not AccountInfo.objects.filter(user=user).exists():
                plan_cost = Decimal(str(random.choice([99, 199, 299, 499])))
                taxes = plan_cost * Decimal('0.15')
                extras = Decimal(str(random.uniform(0, 100))).quantize(Decimal('0.01'))

                AccountInfo.objects.create(
                    user=user,
                    plan_cost=plan_cost,
                    taxes=taxes.quantize(Decimal('0.01')),
                    extras=extras,
                    total_balance=(plan_cost + taxes + extras).quantize(Decimal('0.01')),
                )

        self.stdout.write(f'  Created {AccountInfo.objects.count()} account info records')
