const Book = require('../models/book');
const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const getBooks = async (req, res) => {
    try {
        const { title, genre, author, rating, question, sortBy = "rating" } = req.query;

        if (question) {
            //AI Search
            const books = await Book.find({}).lean();
            const bookContext = books
                .map(
                    (book) =>
                        `Title: ${book.title}, Author: ${book.author}, Genre: ${book.genre}, Rating: ${book.rating}, publishedDate: ${book.publishedDate}, coverImage: ${book.coverImage}`
                )
                .join('\n');
            const prompt = `You are a book recommendation assistant. Based on the following book data, provide personalized book recommendations:${bookContext}`;

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                temperature: 1,
                max_tokens: 4096,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                response_format: {
                    "type": "json_object"
                },
                messages: [
                    {
                        "role": "system",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": `${question}, response should be books array containing json in format title, auther, genre, rating, coverImage, publishedDate`
                            }
                        ]
                    }]
            })
            const recommendations = JSON.parse(response.choices[0].message.content.trim());
            res.status(200).json(recommendations.books);
        } else {
            // Manual search
            let filter = {};
            if (title) {
                filter.title = { $regex: title, $options: 'i' };
            }
            if (genre) filter.genre = { $regex: genre, $options: 'i' };
            if (author) filter.author = { $regex: author, $options: 'i' };
            if (rating) filter.rating = { $gte: rating };

            const books = await Book.find(filter).sort({[sortBy]: -1});
            res.json(books);
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
};

module.exports = { getBooks };
