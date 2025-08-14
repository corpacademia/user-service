const express = require('express');

const {
    signupController,
    loginController,
    getAllUsers,
    addUser,
    getUserData,
    updateUserOrganization,
    updateUserRole,
    getTokenAndGetUserDetails,
    logoutController,
    updateUserController,
    getUsersFromOrganization,
    deleteUsers,
    updateUser,
    insertUsers,
    addOrganizationUser,
    getOrganizationUser,
    deleteRandomUsers,
} = require('../controllers/authController');

const router = express.Router();

// Define routes
router.post('/signup', signupController);
router.post('/login', loginController);
router.get('/allUsers', getAllUsers);
router.post('/addUser', addUser);
router.post('/getuserdata/:id', getUserData);
router.put('/updateUserOrganization', updateUserOrganization);
router.put('/updateUserRole', updateUserRole);
router.get('/user_profile', getTokenAndGetUserDetails, (req, res) => {
    res.json({ user: req.userData });
});
router.post('/logout', logoutController);
router.put('/updateUser/:id', updateUserController);
router.get('/getUsersFromOrganization/:orgId', getUsersFromOrganization);
router.post('/deleteOrganizationUsers', deleteUsers);
router.put('/updateUserFromSuperadmin/:id', updateUser);
router.post('/insertUsers', insertUsers);
router.post('/addOrganizationUser', addOrganizationUser);
router.post('/getOrganizationUsers', getOrganizationUser);
router.post('/deleteUsers', deleteRandomUsers);

module.exports = router;
