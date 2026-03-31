// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  const supabase = req.app.get('supabase');

  try {
    // Generate user using standard signUp API
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: role || 'viewer' }
      }
    });

    if (error) throw error;
    res.status(201).json({ success: true, data: data.user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const supabase = req.app.get('supabase');

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide email and password' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
       console.warn(`[SECURITY ALERT] Failed login attempt for user ${email}: ${error.message}`);
       return res.status(401).json({ success: false, error: error.message });
    }

    res.status(200).json({ 
      success: true, 
      token: data.session.access_token, 
      refreshToken: data.session.refresh_token,
      user: data.user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  const supabase = req.app.get('supabase');
  
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) throw error;
    
    return res.status(200).json({ success: true, token: data.session.access_token });
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Invalid refresh token' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  // req.user is already populated by auth middleware verifying the real Supabase JWT
  if (!req.user) return res.status(404).json({ success: false, error: "User not found" });

  res.status(200).json({ success: true, data: req.user });
};
