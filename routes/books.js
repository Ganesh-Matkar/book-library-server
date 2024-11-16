const express = require('express');
const router = express.Router();
const { getBooks } = require('../controllers/book');

router.get('/', getBooks);

module.exports = router;
