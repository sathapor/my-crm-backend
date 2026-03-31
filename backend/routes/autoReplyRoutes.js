const express = require('express');
const router = express.Router();
const autoReplyController = require('../controllers/autoReplyController');

router.get('/', autoReplyController.getAutoReplies);
router.post('/', autoReplyController.createAutoReply);
router.put('/:id', autoReplyController.updateAutoReply);
router.delete('/:id', autoReplyController.deleteAutoReply);

module.exports = router;
