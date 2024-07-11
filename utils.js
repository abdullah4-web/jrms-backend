import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role, 
      picture: user.picture,
      contact: user.contact,
      nationality: user.nationality,
      emid: user.emid,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );
};

export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.slice(7); // Remove "Bearer " from the token string
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).send({ message: 'Invalid Token' });
      } else {
        req.user = decoded; // Decoded token contains user information
        next();
      }
    });
  } else {
    res.status(401).send({ message: 'No Token' });
  }
};

export const hasRole = (roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(401).send({ message: 'Unauthorized' });
    }
  };
};

export const isAdmin = hasRole(['admin']);
export const isSuperAdmin = hasRole(['superadmin']);
export const isOwner = hasRole(['owner']);
