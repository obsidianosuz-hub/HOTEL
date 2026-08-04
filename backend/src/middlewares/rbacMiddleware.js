const prisma = require('../utils/prismaClient');

const checkPermission = (moduleName, requiredAction) => {
  return async (req, res, next) => {
    try {
      const { roleId, roleName } = req.user;

      // Super Admin bypass
      if (roleName === 'Admin') {
        return next();
      }

      const permission = await prisma.permission.findFirst({
        where: {
          role_id: roleId,
          module: moduleName
        }
      });

      if (!permission) {
        return res.status(403).json({ error: `Forbidden: No permissions for module '${moduleName}'` });
      }

      let hasAccess = false;
      switch (requiredAction) {
        case 'view': hasAccess = permission.can_view; break;
        case 'create': hasAccess = permission.can_create; break;
        case 'edit': hasAccess = permission.can_edit; break;
        case 'delete': hasAccess = permission.can_delete; break;
      }

      if (!hasAccess) {
        return res.status(403).json({ error: `Forbidden: Missing '${requiredAction}' permission for '${moduleName}'` });
      }

      next();
    } catch (error) {
      console.error('RBAC Error:', error);
      res.status(500).json({ error: 'Internal server error checking permissions' });
    }
  };
};

module.exports = checkPermission;
