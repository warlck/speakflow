export const EXERCISES = [
  {
    id: 'word-rescue',
    title: 'Word Rescue',
    icon: '⚡',
    description: 'Build active recall under time pressure. The app will present a definition, and you must vocalize the exact word or describe it immediately if stuck.',
    duration: 60,
    prompts: [
      { clue: 'A state of temporary disuse or suspension.', answer: 'abeyance' },
      { clue: 'Extremely talkative, especially on trivial matters.', answer: 'garrulous' },
      { clue: 'Expressing contempt or ridicule.', answer: 'derisive' },
      { clue: 'To make someone feel liquid, weak, or nervous.', answer: 'unnerve' },
      { clue: 'The ability to make good judgments and quick decisions.', answer: 'acumen' },
      { clue: 'Doubtful or distrustful of human sincerity.', answer: 'cynical' }
    ]
  },
  {
    id: 'pause-recover',
    title: 'Pause & Recover',
    icon: '🧘',
    description: 'Practice the parking technique. When presented with a challenging topic, intentionally pause for 2 seconds to formulate your next thought instead of using filler words.',
    duration: 90,
    prompts: [
      { text: 'Explain how your favorite piece of technology works without using the word "computer" or "phone".' },
      { text: 'Describe what it feels like to walk through a busy market using only sensory details.' },
      { text: 'Detail how you would plan a trip to a remote island, focusing on logistics.' }
    ]
  },
  {
    id: 'synonym-sprint',
    title: 'Synonym Sprint',
    icon: '🏃',
    description: 'Expand your alternative word pathway. You are given a basic adjective, say as many synonyms as you can in 30 seconds to bypass recall blocks.',
    duration: 30,
    prompts: [
      { word: 'Happy' },
      { word: 'Difficult' },
      { word: 'Beautiful' },
      { word: 'Intelligent' },
      { word: 'Scared' }
    ]
  },
  {
    id: 'story-chain',
    title: 'Story Chain',
    icon: '⛓️',
    description: 'Weave 4 unrelated words into a cohesive story. This exercises associative vocabulary connections in your brain.',
    duration: 120,
    prompts: [
      { words: ['Microscope', 'Jungle', 'Guitar', 'Suspicion'] },
      { words: ['Waterfall', 'Laptop', 'Compassion', 'Elevator'] },
      { words: ['Astronaut', 'Bicycle', 'Sandwich', 'Whisper'] }
    ]
  }
];
