const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbs = require('../../database/db');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        {
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        },
        process.env.JWT_SECRET || 'karnya_secret_key',
        { expiresIn: '30d' }
    );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, phone, userType } = req.body;

    try {
        // Check if user already exists
        let user = await new Promise((resolve, reject) => {
            dbs.users.findOne({ email }, (err, doc) => {
                if (err) reject(err);
                resolve(doc);
            });
        });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            userType,
            role: userType === 'admin' ? 'admin' : 'user',
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Save user to database
        dbs.users.insert(newUser, async (err, user) => {
            if (err) {
                console.error('Error saving user:', err);
                return res.status(500).json({ message: 'Server error' });
            }

            // Generate token
            const token = generateToken(user);

            // Don't send password in response
            delete user.password;

            res.status(201).json({
                success: true,
                token,
                user
            });
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await new Promise((resolve, reject) => {
            dbs.users.findOne({ email }, (err, doc) => {
                if (err) reject(err);
                resolve(doc);
            });
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if account is verified
        if (!user.isVerified) {
            return res.status(400).json({ 
                message: 'Please verify your email before logging in',
                requiresVerification: true,
                userId: user._id
            });
        }

        // Generate token
        const token = generateToken(user);

        // Don't send password in response
        delete user.password;

        res.json({
            success: true,
            token,
            user
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await new Promise((resolve, reject) => {
            dbs.users.findOne({ _id: req.user.id }, { password: 0 }, (err, doc) => {
                if (err) reject(err);
                resolve(doc);
            });
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await new Promise((resolve, reject) => {
            dbs.users.findOne({ email }, (err, doc) => {
                if (err) reject(err);
                resolve(doc);
            });
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'karnya_secret_key',
            { expiresIn: '1h' }
        );

        // Save reset token to user
        await new Promise((resolve, reject) => {
            dbs.users.update(
                { _id: user._id },
                { $set: { resetPasswordToken: resetToken, resetPasswordExpires: Date.now() + 3600000 } },
                {},
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        // TODO: Send email with reset link
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
        console.log('Reset URL:', resetUrl);

        res.json({ message: 'Password reset email sent' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'karnya_secret_key');
        
        // Find user by token
        const user = await new Promise((resolve, reject) => {
            dbs.users.findOne({ 
                _id: decoded.userId,
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            }, (err, doc) => {
                if (err) reject(err);
                resolve(doc);
            });
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user password and clear reset token
        await new Promise((resolve, reject) => {
            dbs.users.update(
                { _id: user._id },
                { 
                    $set: { 
                        password: hashedPassword,
                        updatedAt: new Date()
                    },
                    $unset: { 
                        resetPasswordToken: 1,
                        resetPasswordExpires: 1
                    }
                },
                {},
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
