# HRIS Database Login Setup

## Quick Start

### 1. Database Setup
First, you need to set up the MySQL database. Run this file in your browser:
```
http://localhost/sdca-hris/setup-db.php
```

This will create:
- **Database**: `hris_db`
- **Table**: `users`
- **Sample User**: 
  - Email: `john.doe@company.com`
  - Password: `123456`

### 2. Update Database Configuration
Edit `config.php` with your MySQL credentials:
```php
$host = 'localhost';      // Your MySQL host
$db_user = 'root';        // Your MySQL username
$db_password = '';        // Your MySQL password
$db_name = 'hris_db';     // Database name
```

### 3. File Structure

**PHP Backend Files:**
- `config.php` - Database configuration
- `setup-db.php` - Database initialization (run once)
- `login-handler.php` - Login processing
- `register-handler.php` - Registration processing
- `logout.php` - Logout handler
- `auth-check.php` - Authentication verification

**Frontend Files:**
- `login.html` - Login page (static HTML)
- `register.html` - Registration page (static HTML)
- `index.php` - Home page (requires login)
- `announcements.php` - Announcements page (requires login)
- `employeedirectory.php` - Employee directory (requires login)
- `leave.php` - Leave management (requires login)
- `audit.php` - Audit trail (requires login)

### 4. Update File Extensions

The following files need to be renamed or accessed as .php:
- `index.html` → use as `index.php`
- `announcements.html` → use `announcements.php` (already created)
- `employeedirectory.html` → use `employeedirectory.php` (already created)
- `leave.html` → use `leave.php` (already created)
- `audit.html` → use `audit.php` (already created)

Keep these as HTML (no login required):
- `login.html`
- `register.html`

### 5. Login Flow

1. User visits `login.html`
2. Enters credentials and submits
3. `login-handler.php` validates against database
4. If valid, creates session and redirects to `index.php`
5. Protected pages check session with `auth-check.php`
6. If not logged in, redirects to `login.html`

### 6. Features Implemented

✅ User registration with validation
✅ Secure password hashing
✅ Session-based authentication
✅ Protected pages (require login)
✅ User profile display (name, position, department)
✅ Logout functionality
✅ Email uniqueness validation
✅ Password confirmation matching

### 7. Default Test Account

After running `setup-db.php`:
- **Email**: john.doe@company.com
- **Password**: 123456

### 8. Server Requirements

- PHP 5.7+ (for password_hash)
- MySQL 5.7+
- Web server with PHP support (Apache, Nginx, etc.)

### 9. Security Notes

- Passwords are hashed using bcrypt (PASSWORD_DEFAULT)
- All user inputs are escaped/parameterized
- Sessions are used for authentication
- Add HTTPS in production
- Change database credentials in production
- Use environment variables for sensitive data
