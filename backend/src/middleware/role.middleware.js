export const allowRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.membership) {
            return res.status(403).json({
                success: false,
                message: "Membership required",
            });
        }

        if (!allowedRoles.includes(req.membership.role)) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission",
            });
        }

        next();
    };
};
