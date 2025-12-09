const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const OpenAI = require('openai');

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!openaiApiKey) {
    console.warn('[Assistant] OPENAI_API_KEY is not set. The assistant route will return 500 until it is configured.');
}

const client = openaiApiKey
    ? new OpenAI({ apiKey: openaiApiKey })
    : null;

/**
 * POST /api/assistant/chat
 * Body: { message: string, context?: object }
 * Returns: { reply: string }
 */
router.post('/chat', protect, async (req, res, next) => {
    try {
        if (!client) {
            return res.status(500).json({ message: 'Assistant not configured. Missing OPENAI_API_KEY.' });
        }

        const { message, context } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ message: 'Field "message" is required.' });
        }

        const systemPrompt = [
            'You are KubePulse, an assistant that helps users debug and understand their Kubernetes cluster.',
            'You will receive a natural language question and (optionally) UI context from the dashboard as JSON.',
            'Use the context JSON to stay focused on the pod, namespace or resource the user is currently looking at.',
            'Explain things clearly and safely. If you are not sure, say so and suggest kubectl or logs the user can check.'
        ].join(' ');

        const contextString = context ? JSON.stringify(context, null, 2) : 'null';

        const response = await client.chat.completions.create({
            model: openaiModel,
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        'User message:',
                        message,
                        '',
                        'UI context (JSON):',
                        contextString
                    ].join('\n')
                }
            ]
        });

        const reply = response.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';

        res.json({ reply });
    } catch (error) {
        console.error('Assistant /chat error:', error);
        next(error);
    }
});

module.exports = router;
