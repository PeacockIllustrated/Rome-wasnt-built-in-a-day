// js/quiz-logic.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Quiz Data (Example) ---
    // In a real app, this might be fetched from a server or DataManager
    const quizData = [
        {
            question: "What was the name of the legendary founder of Rome, said to have been raised by a she-wolf?",
            options: ["Julius Caesar", "Augustus", "Romulus", "Nero"],
            correctAnswerIndex: 2, // Index of "Romulus"
            feedback: "Correct! Romulus, along with his twin brother Remus, is the traditional founder of Rome."
        },
        {
            question: "Which famous Roman general crossed the Rubicon river, famously saying 'Alea iacta est' (The die is cast)?",
            options: ["Scipio Africanus", "Pompey the Great", "Mark Antony", "Julius Caesar"],
            correctAnswerIndex: 3,
            feedback: "Indeed! Julius Caesar's crossing of the Rubicon marked a point of no return, leading to civil war."
        },
        {
            question: "What material, perfected by the Romans, allowed them to build large, durable structures like the Pantheon and aqueducts?",
            options: ["Marble", "Concrete (Opus Caementicium)", "Granite", "Terracotta"],
            correctAnswerIndex: 1,
            feedback: "Excellent! Roman concrete was a revolutionary material, key to their architectural marvels."
        },
        {
            question: "The Punic Wars were a series of three wars fought between Rome and which other major power of the ancient Mediterranean?",
            options: ["Greece", "Persia", "Egypt", "Carthage"],
            correctAnswerIndex: 3,
            feedback: "Spot on! The Punic Wars were a defining conflict between Rome and Carthage for dominance."
        },
        {
            question: "Which Roman emperor is known for building a massive wall across northern Britain to mark the empire's frontier?",
            options: ["Augustus", "Trajan", "Hadrian", "Constantine"],
            correctAnswerIndex: 2,
            feedback: "That's right! Hadrian's Wall was a significant defensive fortification."
        }
        // Add more questions here
    ];

    // --- DOM Element References ---
    const quizSection = document.getElementById('romeQuizSection');
    const quizTitleEl = document.getElementById('quizTitle'); // If you want to dynamically set it
    const currentQuestionNumberEl = document.getElementById('currentQuestionNumber');
    const totalQuizQuestionsEl = document.getElementById('totalQuizQuestions');
    const quizQuestionTextEl = document.getElementById('quizQuestionText');
    const quizOptionsContainerEl = document.getElementById('quizOptionsContainer');
    const quizFeedbackAreaEl = document.getElementById('quizFeedbackArea');
    const quizFeedbackTextEl = document.getElementById('quizFeedbackText');
    const submitAnswerButton = document.getElementById('submitAnswerButton');
    const nextQuestionButton = document.getElementById('nextQuestionButton');
    const quizResultsAreaEl = document.getElementById('quizResultsArea');
    const quizFinalScoreEl = document.getElementById('quizFinalScore');
    const quizTotalPossibleScoreEl = document.getElementById('quizTotalPossibleScore');
    const restartQuizButton = document.getElementById('restartQuizButton');
    const returnToHubButton = document.getElementById('returnToHubButton'); // Assuming this navigates away

    // --- Quiz State Variables ---
    let currentQuestionIndex = 0;
    let score = 0;
    let selectedOptionIndex = null;
    let quizActive = false;

    // --- Main Quiz Initialization (Called when quiz should start, e.g., after ad) ---
    function startQuiz() {
        if (!quizSection) {
            console.error("Quiz section element not found!");
            return;
        }
        quizSection.style.display = 'block'; // Show the quiz section
        currentQuestionIndex = 0;
        score = 0;
        selectedOptionIndex = null;
        quizActive = true;

        quizResultsAreaEl.style.display = 'none';
        submitAnswerButton.style.display = 'inline-block';
        nextQuestionButton.style.display = 'none';
        quizFeedbackAreaEl.style.display = 'none';

        totalQuizQuestionsEl.textContent = quizData.length;
        loadQuestion();
    }

    // --- Load and Display Current Question ---
    function loadQuestion() {
        if (currentQuestionIndex >= quizData.length) {
            endQuiz();
            return;
        }

        const currentQuestion = quizData[currentQuestionIndex];
        currentQuestionNumberEl.textContent = currentQuestionIndex + 1;
        quizQuestionTextEl.textContent = currentQuestion.question;

        quizOptionsContainerEl.innerHTML = ''; // Clear previous options
        currentQuestion.options.forEach((option, index) => {
            const optionButton = document.createElement('button');
            optionButton.className = 'quiz-option-button btn';
            optionButton.textContent = option; // Simple text, can be formatted like "A. Option"
            optionButton.dataset.optionIndex = index;
            optionButton.addEventListener('click', handleOptionSelect);
            quizOptionsContainerEl.appendChild(optionButton);
        });

        submitAnswerButton.disabled = true; // Disabled until an option is selected
        submitAnswerButton.style.display = 'inline-block';
        nextQuestionButton.style.display = 'none';
        quizFeedbackAreaEl.style.display = 'none';
        selectedOptionIndex = null; // Reset selected option for the new question
    }

    // --- Handle Option Selection ---
    function handleOptionSelect(event) {
        if (!quizActive) return; // Don't allow selection if quiz is not active (e.g., after submission)

        // Remove 'selected' class from previously selected option (if any)
        const previouslySelected = quizOptionsContainerEl.querySelector('.quiz-option-button.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        // Add 'selected' class to the clicked option
        event.currentTarget.classList.add('selected');
        selectedOptionIndex = parseInt(event.currentTarget.dataset.optionIndex);
        submitAnswerButton.disabled = false; // Enable submit button
    }

    // --- Handle Answer Submission ---
    function submitAnswer() {
        if (selectedOptionIndex === null || !quizActive) return;

        quizActive = false; // Lock interaction until next question
        submitAnswerButton.disabled = true; // Prevent re-submission

        const currentQuestion = quizData[currentQuestionIndex];
        const correct = selectedOptionIndex === currentQuestion.correctAnswerIndex;

        // Disable all option buttons after submission
        const optionButtons = quizOptionsContainerEl.querySelectorAll('.quiz-option-button');
        optionButtons.forEach(button => {
            button.disabled = true; // Disable button
            const buttonIndex = parseInt(button.dataset.optionIndex);
            if (buttonIndex === currentQuestion.correctAnswerIndex) {
                button.classList.add('correct-answer'); // Always show correct answer
            }
            if (buttonIndex === selectedOptionIndex && !correct) {
                button.classList.add('incorrect-answer'); // Highlight user's wrong choice
            }
        });

        if (correct) {
            score++;
            quizFeedbackTextEl.textContent = currentQuestion.feedback || "Correct!";
            quizFeedbackAreaEl.className = 'quiz-feedback feedback-correct'; // Apply correct class
        } else {
            quizFeedbackTextEl.textContent = currentQuestion.feedbackIncorrect || `Incorrect. The correct answer was: ${currentQuestion.options[currentQuestion.correctAnswerIndex]}`;
            if (currentQuestion.feedback) quizFeedbackTextEl.textContent += `\n${currentQuestion.feedback}`;
            quizFeedbackAreaEl.className = 'quiz-feedback feedback-incorrect'; // Apply incorrect class
        }

        quizFeedbackAreaEl.style.display = 'block';
        submitAnswerButton.style.display = 'none';
        nextQuestionButton.style.display = 'inline-block';

        // Optional: Award points using DataManager
        // if (typeof DataManager !== 'undefined' && typeof DataManager.addPoints === 'function') {
        //     DataManager.addPoints(correct ? 10 : 1); // Example: 10 for correct, 1 for trying
        // }
    }

    // --- Handle Next Question ---
    function nextQuestion() {
        currentQuestionIndex++;
        quizActive = true; // Re-enable quiz interaction for the new question
        loadQuestion();
    }

    // --- End Quiz and Show Results ---
    function endQuiz() {
        quizActive = false;
        quizSection.style.display = 'block'; // Ensure quiz section is visible if somehow hidden
        quizQuestionAreaEl.style.display = 'none'; // Hide question area
        quizOptionsContainerEl.style.display = 'none'; // Hide options
        quizFeedbackAreaEl.style.display = 'none'; // Hide feedback
        quizNavigation.style.display = 'none'; // Hide submit/next buttons

        quizFinalScoreEl.textContent = score;
        quizTotalPossibleScoreEl.textContent = quizData.length;
        quizResultsAreaEl.style.display = 'block';

        // Optional: Save final score via DataManager
        // if (typeof DataManager !== 'undefined' && typeof DataManager.saveQuizResult === 'function') {
        //    DataManager.saveQuizResult({ score: score, total: quizData.length, quizId: 'roman_trivia_1' });
        // }
    }

    // --- Event Listeners for Buttons ---
    if (submitAnswerButton) {
        submitAnswerButton.addEventListener('click', submitAnswer);
    }
    if (nextQuestionButton) {
        nextQuestionButton.addEventListener('click', nextQuestion);
    }
    if (restartQuizButton) {
        restartQuizButton.addEventListener('click', () => {
            quizResultsAreaEl.style.display = 'none';
            quizQuestionAreaEl.style.display = 'block'; // Re-show question area
            quizOptionsContainerEl.style.display = 'grid'; // Re-show options as grid
            quizNavigation.style.display = 'flex';   // Re-show nav buttons
            startQuiz(); // Restart the quiz
        });
    }
    if (returnToHubButton) {
        returnToHubButton.addEventListener('click', () => {
            // Navigate back to the main hub (index.html)
            // This assumes quiz section is part of index.html and you just hide it
            if (quizSection) quizSection.style.display = 'none';
            // If it's a separate page, use: window.location.href = '../../index.html'; (adjust path)
            // Or trigger a function in main-hub.js to show the main dashboard view
            console.log("Returning to Hub (hide quiz section)");
        });
    }


    // --- EXPOSE startQuiz TO BE CALLED EXTERNALLY (e.g., after an ad) ---
    // This makes it available on the window object, or you can use a more sophisticated module pattern.
    window.initiateRomeQuiz = startQuiz;
    // Example: If your ad logic is in main-hub.js and it needs to call startQuiz:
    // It would call `window.initiateRomeQuiz();`

    // --- Auto-start quiz for testing (REMOVE FOR PRODUCTION IF TRIGGERED BY AD) ---
    // If you want the quiz to start immediately when this script loads FOR TESTING:
    // startQuiz(); 
    // OR, if you have a button that triggers the ad, and then the ad triggers the quiz,
    // that button's event listener should eventually call `window.initiateRomeQuiz();`
    // For now, we assume it's triggered externally (e.g., by your ad flow).

    console.log("Quiz logic initialized. Call window.initiateRomeQuiz() to start.");

}); // End DOMContentLoaded
