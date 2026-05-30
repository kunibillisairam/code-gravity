import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, CheckCircle, HelpCircle, BookOpen, ChevronRight, Filter, Sparkles, Trophy, ListCollapse } from 'lucide-react';

const CURRICULUM_MAP = {
  python: [
    { id: 'python-basics', name: '1. Python Basics', problems: ['Hello World', 'Print Function', 'Input Output', 'Variables', 'Comments', 'Data Types', 'Type Conversion', 'String Concatenation', 'Basic Formatting', 'Constants and Literals'] },
    { id: 'operators', name: '2. Operators', problems: ['Arithmetic Operators', 'Comparison Operators', 'Logical Operators', 'Assignment Operators', 'Bitwise Basics', 'Identity Operators', 'Membership Operators', 'Operator Precedence', 'Modulo Operator', 'Shift Operators'] },
    { id: 'conditionals', name: '3. Conditional Statements', problems: ['If Else', 'Nested If', 'Grading System', 'Leap Year', 'Largest of 3 Numbers', 'Even or Odd', 'Vowel or Consonant', 'Quadrant Finder', 'Triangle Validity', 'Calculator Program'] },
    { id: 'loops', name: '4. Loops', problems: ['For Loop', 'While Loop', 'Pattern Printing', 'Multiplication Tables', 'Sum of Numbers', 'Factorial', 'Fibonacci Series', 'Prime Number Check', 'Reverse a Number', 'Count Digits'] },
    { id: 'functions', name: '5. Functions', problems: ['Write a Function', 'Lambda Basics', 'Recursion Basics', 'Function Arguments', 'Return Values', 'Default Parameters', 'Keyword Arguments', 'Variable Scope', 'Function docstrings', 'Inner Functions'] },
    { id: 'strings', name: '6. Strings', problems: ['Reverse String', 'Palindrome', 'Count Vowels', 'String Slicing', 'Anagram', 'String Compression', 'Substring Search', 'Capitalize Words', 'Character Frequency', 'String Replacement'] },
    { id: 'lists', name: '7. Lists', problems: ['List Operations', 'Find Maximum', 'Second Largest', 'Remove Duplicates', 'Rotate Array', 'Sorting Lists', 'Sum and Average', 'Merge Sorted Arrays', 'Count Occurrences', 'Subarray with Sum'] },
    { id: 'tuples', name: '8. Tuples', problems: ['Tuple Basics', 'Tuple Unpacking', 'Tuple Operations', 'Tuple Slicing', 'Convert Tuple to List', 'Nested Tuples', 'Find Index of Element', 'Tuple Length and Count', 'Check Element Existence', 'Named Tuples Basics'] },
    { id: 'sets', name: '9. Sets', problems: ['Unique Elements', 'Set Operations', 'Intersection', 'Union', 'Symmetric Difference', 'Subset Check', 'Disjoint Sets', 'Clear and Copy', 'Add and Remove', 'Frozen Sets Basics'] },
    { id: 'dictionaries', name: '10. Dictionaries', problems: ['Frequency Counter', 'Word Count', 'Student Marks', 'Dictionary Sorting', 'Key Value Manipulation', 'Default Dictionary', 'Merge Dictionaries', 'Key Existence Check', 'Nested Dictionaries', 'Map Keys to Values'] },
    { id: 'list-comprehension', name: '11. List Comprehension', problems: ['Basic List Comprehension', 'Nested List Comprehension', 'Filtering Lists', 'String Lengths Map', 'Square of Even Numbers', 'Transpose Matrix', 'Dictionary Comprehension', 'Set Comprehension', 'Flatten a List of Lists', 'Conditional Comprehension'] },
    { id: 'exceptions', name: '12. Exception Handling', problems: ['Try Except', 'Zero Division', 'Custom Exceptions', 'Finally Block', 'Value Error Catch', 'Multiple Exceptions', 'Raising Exceptions', 'Assertion Error', 'Index Out of Range', 'Nested Try Blocks'] },
    { id: 'file-handling', name: '13. File Handling', problems: ['Read File', 'Write File', 'CSV Reader', 'File Counter', 'Append File', 'Line Count in File', 'Find Word in File', 'Copy File Content', 'File Permissions', 'File Existence Check'] },
    { id: 'oops', name: '14. OOPs in Python', problems: ['Classes & Objects', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Constructor', 'Class vs Instance Variables', 'Method Overriding', 'Abstract Classes', 'Multiple Inheritance', 'Getter and Setter Methods'] },
    { id: 'searching', name: '15. Searching Algorithms', problems: ['Linear Search', 'Binary Search', 'Jump Search', 'Sentinel Linear Search', 'Interpolation Search', 'Search in Matrix', 'First and Last Position', 'Peak Index in Array', 'Find K Closest Elements', 'Exponential Search'] },
    { id: 'sorting', name: '16. Sorting Algorithms', problems: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Quick Sort', 'Insertion Sort', 'Radix Sort', 'Heap Sort', 'Counting Sort', 'Shell Sort', 'Bucket Sort'] },
    { id: 'stack', name: '17. Stack', problems: ['Stack Using List', 'Valid Parentheses', 'Next Greater Element', 'Min Stack Design', 'Stack Reverse', 'Postfix Evaluation', 'Sort Stack', 'Implement Queue Using Stacks', 'Two Stacks in One Array', 'Stock Span Problem'] },
    { id: 'queue', name: '18. Queue', problems: ['Queue Basics', 'Circular Queue', 'Priority Queue', 'Deque Operations', 'Implement Stack Using Queues', 'First Unique Character', 'Reverse First K Elements', 'Sliding Window Maximum', 'Generate Binary Numbers', 'Queue Using Linked List'] },
    { id: 'linked-list', name: '19. Linked List', problems: ['Singly Linked List', 'Reverse Linked List', 'Detect Cycle', 'Merge Two Sorted Lists', 'Find Middle Element', 'Remove Nth Node from End', 'Doubly Linked List', 'Intersection of Two Lists', 'Circular Linked List', 'Palindrome Linked List'] },
    { id: 'trees', name: '20. Trees', problems: ['Binary Tree Traversal', 'Height of Tree', 'BST Basics', 'Level Order Traversal', 'Invert Binary Tree', 'Symmetric Tree', 'Lowest Common Ancestor', 'Path Sum Check', 'Diameter of Binary Tree', 'Convert Array to BST'] },
    { id: 'graphs', name: '21. Graphs', problems: ['BFS', 'DFS', 'Shortest Path', 'Detect Cycle in Directed Graph', 'Detect Cycle in Undirected Graph', 'Topological Sort', 'Number of Islands', 'Dijkstra\'s Algorithm', 'Prim\'s MST', 'Flood Fill'] },
    { id: 'dynamic-programming', name: '22. Dynamic Programming', problems: ['Fibonacci DP', 'Knapsack', 'Longest Common Subsequence', 'Climbing Stairs', 'Coin Change', 'Longest Increasing Subsequence', 'Edit Distance', 'Min Cost Path', 'House Robber', 'Decode Ways'] }
  ],
  javascript: [
    { id: 'js-basics', name: '1. JS Basics', problems: ['Hello World', 'Print Function', 'Input Output', 'Variables', 'Comments', 'Data Types', 'Type Conversion', 'String Concatenation', 'Basic Formatting', 'Constants and Literals'] },
    { id: 'operators', name: '2. Operators', problems: ['Arithmetic Operators', 'Comparison Operators', 'Logical Operators', 'Assignment Operators', 'Bitwise Basics', 'Identity Operators', 'Membership Operators', 'Operator Precedence', 'Modulo Operator', 'Shift Operators'] },
    { id: 'conditionals', name: '3. Conditionals', problems: ['If Else', 'Nested If', 'Grading System', 'Leap Year', 'Largest of 3 Numbers', 'Even or Odd', 'Vowel or Consonant', 'Quadrant Finder', 'Triangle Validity', 'Calculator Program'] },
    { id: 'loops', name: '4. Loops', problems: ['For Loop', 'While Loop', 'Pattern Printing', 'Multiplication Tables', 'Sum of Numbers', 'Factorial', 'Fibonacci Series', 'Prime Number Check', 'Reverse a Number', 'Count Digits'] },
    { id: 'functions', name: '5. Functions & Scope', problems: ['Write a Function', 'Lambda Basics', 'Recursion Basics', 'Function Arguments', 'Return Values', 'Default Parameters', 'Keyword Arguments', 'Variable Scope', 'Function docstrings', 'Inner Functions'] },
    { id: 'strings', name: '6. Strings', problems: ['Reverse String', 'Palindrome', 'Count Vowels', 'String Slicing', 'Anagram', 'String Compression', 'Substring Search', 'Capitalize Words', 'Character Frequency', 'String Replacement'] },
    { id: 'lists', name: '7. Arrays', problems: ['List Operations', 'Find Maximum', 'Second Largest', 'Remove Duplicates', 'Rotate Array', 'Sorting Lists', 'Sum and Average', 'Merge Sorted Arrays', 'Count Occurrences', 'Subarray with Sum'] },
    { id: 'tuples', name: '8. Objects (Tuples)', problems: ['Tuple Basics', 'Tuple Unpacking', 'Tuple Operations', 'Tuple Slicing', 'Convert Tuple to List', 'Nested Tuples', 'Find Index of Element', 'Tuple Length and Count', 'Check Element Existence', 'Named Tuples Basics'] },
    { id: 'sets', name: '9. Sets & Maps', problems: ['Unique Elements', 'Set Operations', 'Intersection', 'Union', 'Symmetric Difference', 'Subset Check', 'Disjoint Sets', 'Clear and Copy', 'Add and Remove', 'Frozen Sets Basics'] },
    { id: 'dictionaries', name: '10. Key-Value Maps', problems: ['Frequency Counter', 'Word Count', 'Student Marks', 'Dictionary Sorting', 'Key Value Manipulation', 'Default Dictionary', 'Merge Dictionaries', 'Key Existence Check', 'Nested Dictionaries', 'Map Keys to Values'] },
    { id: 'list-comprehension', name: '11. Array Comprehension', problems: ['Basic List Comprehension', 'Nested List Comprehension', 'Filtering Lists', 'String Lengths Map', 'Square of Even Numbers', 'Transpose Matrix', 'Dictionary Comprehension', 'Set Comprehension', 'Flatten a List of Lists', 'Conditional Comprehension'] },
    { id: 'exceptions', name: '12. Exception Handling', problems: ['Try Except', 'Zero Division', 'Custom Exceptions', 'Finally Block', 'Value Error Catch', 'Multiple Exceptions', 'Raising Exceptions', 'Assertion Error', 'Index Out of Range', 'Nested Try Blocks'] },
    { id: 'file-handling', name: '13. File Streams (Node)', problems: ['Read File', 'Write File', 'CSV Reader', 'File Counter', 'Append File', 'Line Count in File', 'Find Word in File', 'Copy File Content', 'File Permissions', 'File Existence Check'] },
    { id: 'oops', name: '14. OOPs in ES6', problems: ['Classes & Objects', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Constructor', 'Class vs Instance Variables', 'Method Overriding', 'Abstract Classes', 'Multiple Inheritance', 'Getter and Setter Methods'] },
    { id: 'searching', name: '15. Searching Algorithms', problems: ['Linear Search', 'Binary Search', 'Jump Search', 'Sentinel Linear Search', 'Interpolation Search', 'Search in Matrix', 'First and Last Position', 'Peak Index in Array', 'Find K Closest Elements', 'Exponential Search'] },
    { id: 'sorting', name: '16. Sorting Algorithms', problems: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Quick Sort', 'Insertion Sort', 'Radix Sort', 'Heap Sort', 'Counting Sort', 'Shell Sort', 'Bucket Sort'] },
    { id: 'stack', name: '17. Stack', problems: ['Stack Using List', 'Valid Parentheses', 'Next Greater Element', 'Min Stack Design', 'Stack Reverse', 'Postfix Evaluation', 'Sort Stack', 'Implement Queue Using Stacks', 'Two Stacks in One Array', 'Stock Span Problem'] },
    { id: 'queue', name: '18. Queue', problems: ['Queue Basics', 'Circular Queue', 'Priority Queue', 'Deque Operations', 'Implement Stack Using Queues', 'First Unique Character', 'Reverse First K Elements', 'Sliding Window Maximum', 'Generate Binary Numbers', 'Queue Using Linked List'] },
    { id: 'linked-list', name: '19. Linked List', problems: ['Singly Linked List', 'Reverse Linked List', 'Detect Cycle', 'Merge Two Sorted Lists', 'Find Middle Element', 'Remove Nth Node from End', 'Doubly Linked List', 'Intersection of Two Lists', 'Circular Linked List', 'Palindrome Linked List'] },
    { id: 'trees', name: '20. Trees', problems: ['Binary Tree Traversal', 'Height of Tree', 'BST Basics', 'Level Order Traversal', 'Invert Binary Tree', 'Symmetric Tree', 'Lowest Common Ancestor', 'Path Sum Check', 'Diameter of Binary Tree', 'Convert Array to BST'] },
    { id: 'graphs', name: '21. Graphs', problems: ['BFS', 'DFS', 'Shortest Path', 'Detect Cycle in Directed Graph', 'Detect Cycle in Undirected Graph', 'Topological Sort', 'Number of Islands', 'Dijkstra\'s Algorithm', 'Prim\'s MST', 'Flood Fill'] },
    { id: 'dynamic-programming', name: '22. Dynamic Programming', problems: ['Fibonacci DP', 'Knapsack', 'Longest Common Subsequence', 'Climbing Stairs', 'Coin Change', 'Longest Increasing Subsequence', 'Edit Distance', 'Min Cost Path', 'House Robber', 'Decode Ways'] }
  ],
  cpp: [
    { id: 'cpp-basics', name: '1. C++ Basics', problems: ['Hello World', 'Print Function', 'Input Output', 'Variables', 'Comments', 'Data Types', 'Type Conversion', 'String Concatenation', 'Basic Formatting', 'Constants and Literals'] },
    { id: 'operators', name: '2. Operators', problems: ['Arithmetic Operators', 'Comparison Operators', 'Logical Operators', 'Assignment Operators', 'Bitwise Basics', 'Identity Operators', 'Membership Operators', 'Operator Precedence', 'Modulo Operator', 'Shift Operators'] },
    { id: 'conditionals', name: '3. Conditionals', problems: ['If Else', 'Nested If', 'Grading System', 'Leap Year', 'Largest of 3 Numbers', 'Even or Odd', 'Vowel or Consonant', 'Quadrant Finder', 'Triangle Validity', 'Calculator Program'] },
    { id: 'loops', name: '4. Loops', problems: ['For Loop', 'While Loop', 'Pattern Printing', 'Multiplication Tables', 'Sum of Numbers', 'Factorial', 'Fibonacci Series', 'Prime Number Check', 'Reverse a Number', 'Count Digits'] },
    { id: 'functions', name: '5. Functions', problems: ['Write a Function', 'Lambda Basics', 'Recursion Basics', 'Function Arguments', 'Return Values', 'Default Parameters', 'Keyword Arguments', 'Variable Scope', 'Function docstrings', 'Inner Functions'] },
    { id: 'strings', name: '6. Strings', problems: ['Reverse String', 'Palindrome', 'Count Vowels', 'String Slicing', 'Anagram', 'String Compression', 'Substring Search', 'Capitalize Words', 'Character Frequency', 'String Replacement'] },
    { id: 'lists', name: '7. Vectors', problems: ['List Operations', 'Find Maximum', 'Second Largest', 'Remove Duplicates', 'Rotate Array', 'Sorting Lists', 'Sum and Average', 'Merge Sorted Arrays', 'Count Occurrences', 'Subarray with Sum'] },
    { id: 'tuples', name: '8. Pointers & References', problems: ['Tuple Basics', 'Tuple Unpacking', 'Tuple Operations', 'Tuple Slicing', 'Convert Tuple to List', 'Nested Tuples', 'Find Index of Element', 'Tuple Length and Count', 'Check Element Existence', 'Named Tuples Basics'] },
    { id: 'sets', name: '9. Sets (std::set)', problems: ['Unique Elements', 'Set Operations', 'Intersection', 'Union', 'Symmetric Difference', 'Subset Check', 'Disjoint Sets', 'Clear and Copy', 'Add and Remove', 'Frozen Sets Basics'] },
    { id: 'dictionaries', name: '10. Maps (std::map)', problems: ['Frequency Counter', 'Word Count', 'Student Marks', 'Dictionary Sorting', 'Key Value Manipulation', 'Default Dictionary', 'Merge Dictionaries', 'Key Existence Check', 'Nested Dictionaries', 'Map Keys to Values'] },
    { id: 'list-comprehension', name: '11. Iterators', problems: ['Basic List Comprehension', 'Nested List Comprehension', 'Filtering Lists', 'String Lengths Map', 'Square of Even Numbers', 'Transpose Matrix', 'Dictionary Comprehension', 'Set Comprehension', 'Flatten a List of Lists', 'Conditional Comprehension'] },
    { id: 'exceptions', name: '12. Exception Handling', problems: ['Try Except', 'Zero Division', 'Custom Exceptions', 'Finally Block', 'Value Error Catch', 'Multiple Exceptions', 'Raising Exceptions', 'Assertion Error', 'Index Out of Range', 'Nested Try Blocks'] },
    { id: 'file-handling', name: '13. File Streams', problems: ['Read File', 'Write File', 'CSV Reader', 'File Counter', 'Append File', 'Line Count in File', 'Find Word in File', 'Copy File Content', 'File Permissions', 'File Existence Check'] },
    { id: 'oops', name: '14. Classes & OOP', problems: ['Classes & Objects', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Constructor', 'Class vs Instance Variables', 'Method Overriding', 'Abstract Classes', 'Multiple Inheritance', 'Getter and Setter Methods'] },
    { id: 'searching', name: '15. Searching Algorithms', problems: ['Linear Search', 'Binary Search', 'Jump Search', 'Sentinel Linear Search', 'Interpolation Search', 'Search in Matrix', 'First and Last Position', 'Peak Index in Array', 'Find K Closest Elements', 'Exponential Search'] },
    { id: 'sorting', name: '16. Sorting Algorithms', problems: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Quick Sort', 'Insertion Sort', 'Radix Sort', 'Heap Sort', 'Counting Sort', 'Shell Sort', 'Bucket Sort'] },
    { id: 'stack', name: '17. Stack', problems: ['Stack Using List', 'Valid Parentheses', 'Next Greater Element', 'Min Stack Design', 'Stack Reverse', 'Postfix Evaluation', 'Sort Stack', 'Implement Queue Using Stacks', 'Two Stacks in One Array', 'Stock Span Problem'] },
    { id: 'queue', name: '18. Queue', problems: ['Queue Basics', 'Circular Queue', 'Priority Queue', 'Deque Operations', 'Implement Stack Using Queues', 'First Unique Character', 'Reverse First K Elements', 'Sliding Window Maximum', 'Generate Binary Numbers', 'Queue Using Linked List'] },
    { id: 'linked-list', name: '19. Linked List', problems: ['Singly Linked List', 'Reverse Linked List', 'Detect Cycle', 'Merge Two Sorted Lists', 'Find Middle Element', 'Remove Nth Node from End', 'Doubly Linked List', 'Intersection of Two Lists', 'Circular Linked List', 'Palindrome Linked List'] },
    { id: 'trees', name: '20. Trees', problems: ['Binary Tree Traversal', 'Height of Tree', 'BST Basics', 'Level Order Traversal', 'Invert Binary Tree', 'Symmetric Tree', 'Lowest Common Ancestor', 'Path Sum Check', 'Diameter of Binary Tree', 'Convert Array to BST'] },
    { id: 'graphs', name: '21. Graphs', problems: ['BFS', 'DFS', 'Shortest Path', 'Detect Cycle in Directed Graph', 'Detect Cycle in Undirected Graph', 'Topological Sort', 'Number of Islands', 'Dijkstra\'s Algorithm', 'Prim\'s MST', 'Flood Fill'] },
    { id: 'dynamic-programming', name: '22. Dynamic Programming', problems: ['Fibonacci DP', 'Knapsack', 'Longest Common Subsequence', 'Climbing Stairs', 'Coin Change', 'Longest Increasing Subsequence', 'Edit Distance', 'Min Cost Path', 'House Robber', 'Decode Ways'] }
  ],
  java: [
    { id: 'java-basics', name: '1. Java Basics', problems: ['Hello World', 'Print Function', 'Input Output', 'Variables', 'Comments', 'Data Types', 'Type Conversion', 'String Concatenation', 'Basic Formatting', 'Constants and Literals'] },
    { id: 'operators', name: '2. Operators', problems: ['Arithmetic Operators', 'Comparison Operators', 'Logical Operators', 'Assignment Operators', 'Bitwise Basics', 'Identity Operators', 'Membership Operators', 'Operator Precedence', 'Modulo Operator', 'Shift Operators'] },
    { id: 'conditionals', name: '3. Conditionals', problems: ['If Else', 'Nested If', 'Grading System', 'Leap Year', 'Largest of 3 Numbers', 'Even or Odd', 'Vowel or Consonant', 'Quadrant Finder', 'Triangle Validity', 'Calculator Program'] },
    { id: 'loops', name: '4. Loops', problems: ['For Loop', 'While Loop', 'Pattern Printing', 'Multiplication Tables', 'Sum of Numbers', 'Factorial', 'Fibonacci Series', 'Prime Number Check', 'Reverse a Number', 'Count Digits'] },
    { id: 'functions', name: '5. Methods', problems: ['Write a Function', 'Lambda Basics', 'Recursion Basics', 'Function Arguments', 'Return Values', 'Default Parameters', 'Keyword Arguments', 'Variable Scope', 'Function docstrings', 'Inner Functions'] },
    { id: 'strings', name: '6. Strings', problems: ['Reverse String', 'Palindrome', 'Count Vowels', 'String Slicing', 'Anagram', 'String Compression', 'Substring Search', 'Capitalize Words', 'Character Frequency', 'String Replacement'] },
    { id: 'lists', name: '7. Arrays & ArrayLists', problems: ['List Operations', 'Find Maximum', 'Second Largest', 'Remove Duplicates', 'Rotate Array', 'Sorting Lists', 'Sum and Average', 'Merge Sorted Arrays', 'Count Occurrences', 'Subarray with Sum'] },
    { id: 'tuples', name: '8. Objects & Classes', problems: ['Tuple Basics', 'Tuple Unpacking', 'Tuple Operations', 'Tuple Slicing', 'Convert Tuple to List', 'Nested Tuples', 'Find Index of Element', 'Tuple Length and Count', 'Check Element Existence', 'Named Tuples Basics'] },
    { id: 'sets', name: '9. HashSets', problems: ['Unique Elements', 'Set Operations', 'Intersection', 'Union', 'Symmetric Difference', 'Subset Check', 'Disjoint Sets', 'Clear and Copy', 'Add and Remove', 'Frozen Sets Basics'] },
    { id: 'dictionaries', name: '10. HashMaps', problems: ['Frequency Counter', 'Word Count', 'Student Marks', 'Dictionary Sorting', 'Key Value Manipulation', 'Default Dictionary', 'Merge Dictionaries', 'Key Existence Check', 'Nested Dictionaries', 'Map Keys to Values'] },
    { id: 'list-comprehension', name: '11. Stream API Traversals', problems: ['Basic List Comprehension', 'Nested List Comprehension', 'Filtering Lists', 'String Lengths Map', 'Square of Even Numbers', 'Transpose Matrix', 'Dictionary Comprehension', 'Set Comprehension', 'Flatten a List of Lists', 'Conditional Comprehension'] },
    { id: 'exceptions', name: '12. Exception Handling', problems: ['Try Except', 'Zero Division', 'Custom Exceptions', 'Finally Block', 'Value Error Catch', 'Multiple Exceptions', 'Raising Exceptions', 'Assertion Error', 'Index Out of Range', 'Nested Try Blocks'] },
    { id: 'file-handling', name: '13. File Readers', problems: ['Read File', 'Write File', 'CSV Reader', 'File Counter', 'Append File', 'Line Count in File', 'Find Word in File', 'Copy File Content', 'File Permissions', 'File Existence Check'] },
    { id: 'oops', name: '14. Advanced OOP', problems: ['Classes & Objects', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Constructor', 'Class vs Instance Variables', 'Method Overriding', 'Abstract Classes', 'Multiple Inheritance', 'Getter and Setter Methods'] },
    { id: 'searching', name: '15. Searching Algorithms', problems: ['Linear Search', 'Binary Search', 'Jump Search', 'Sentinel Linear Search', 'Interpolation Search', 'Search in Matrix', 'First and Last Position', 'Peak Index in Array', 'Find K Closest Elements', 'Exponential Search'] },
    { id: 'sorting', name: '16. Sorting Algorithms', problems: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Quick Sort', 'Insertion Sort', 'Radix Sort', 'Heap Sort', 'Counting Sort', 'Shell Sort', 'Bucket Sort'] },
    { id: 'stack', name: '17. Stack', problems: ['Stack Using List', 'Valid Parentheses', 'Next Greater Element', 'Min Stack Design', 'Stack Reverse', 'Postfix Evaluation', 'Sort Stack', 'Implement Queue Using Stacks', 'Two Stacks in One Array', 'Stock Span Problem'] },
    { id: 'queue', name: '18. Queue', problems: ['Queue Basics', 'Circular Queue', 'Priority Queue', 'Deque Operations', 'Implement Stack Using Queues', 'First Unique Character', 'Reverse First K Elements', 'Sliding Window Maximum', 'Generate Binary Numbers', 'Queue Using Linked List'] },
    { id: 'linked-list', name: '19. Linked List', problems: ['Singly Linked List', 'Reverse Linked List', 'Detect Cycle', 'Merge Two Sorted Lists', 'Find Middle Element', 'Remove Nth Node from End', 'Doubly Linked List', 'Intersection of Two Lists', 'Circular Linked List', 'Palindrome Linked List'] },
    { id: 'trees', name: '20. Trees', problems: ['Binary Tree Traversal', 'Height of Tree', 'BST Basics', 'Level Order Traversal', 'Invert Binary Tree', 'Symmetric Tree', 'Lowest Common Ancestor', 'Path Sum Check', 'Diameter of Binary Tree', 'Convert Array to BST'] },
    { id: 'graphs', name: '21. Graphs', problems: ['BFS', 'DFS', 'Shortest Path', 'Detect Cycle in Directed Graph', 'Detect Cycle in Undirected Graph', 'Topological Sort', 'Number of Islands', 'Dijkstra\'s Algorithm', 'Prim\'s MST', 'Flood Fill'] },
    { id: 'dynamic-programming', name: '22. Dynamic Programming', problems: ['Fibonacci DP', 'Knapsack', 'Longest Common Subsequence', 'Climbing Stairs', 'Coin Change', 'Longest Increasing Subsequence', 'Edit Distance', 'Min Cost Path', 'House Robber', 'Decode Ways'] }
  ]
};

const LANGUAGE_DETAILS = {
  python: { name: 'Python 3', tagline: 'Master variables, data structures, and object-oriented paradigms in Python.' },
  javascript: { name: 'JavaScript', tagline: 'Conquer closures, event loops, promises, and functional ES6+ scripts.' },
  cpp: { name: 'C++ 17', tagline: 'Dive deep into memory addressing, pointer arithmetic, and OOP templates.' },
  java: { name: 'Java 13', tagline: 'Harness the power of static typing, JVM execution, and OOP paradigms.' }
};

const TopicExplorer = ({ onSolveProblem }) => {
  const [activeLang, setActiveLang] = useState('python');
  
  // Set default active topic based on current selected language curriculum
  const [activeTopicId, setActiveTopicId] = useState('python-basics');
  
  // Sidebar Filtering States
  const [statusFilters, setStatusFilters] = useState({ Solved: false, Unsolved: false });
  const [difficultyFilters, setDifficultyFilters] = useState({ Easy: false, Medium: false, Hard: false });

  // Sync active topic when switching languages
  useEffect(() => {
    const defaultTopic = CURRICULUM_MAP[activeLang][0].id;
    setActiveTopicId(defaultTopic);
    clearAllFilters();
  }, [activeLang]);

  // Read solved state directly from localStorage closed loop (scoped per user)
  const getProblemStatus = (probId) => {
    const activeUser = localStorage.getItem('codegravity_user') || 'anonymous';
    return localStorage.getItem(`solved_${activeUser}_${probId}`) === 'true' ? 'Solved' : 'Unsolved';
  };

  const getProblemDifficulty = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('circular') || titleLower.includes('priority') || titleLower.includes('cycle') || titleLower.includes('recursion') || titleLower.includes('knapsack') || titleLower.includes('subsequence') || titleLower.includes('dfs') || titleLower.includes('shortest')) {
      return 'Hard';
    }
    if (titleLower.includes('binary') || titleLower.includes('maximum') || titleLower.includes('second') || titleLower.includes('reverse') || titleLower.includes('sorting') || titleLower.includes('grading') || titleLower.includes('duplicates')) {
      return 'Medium';
    }
    return 'Easy';
  };

  // Convert raw title array to complete structured problem list
  const activeCurriculum = useMemo(() => {
    const topics = CURRICULUM_MAP[activeLang] || [];
    return topics.map((topic) => {
      const formattedProblems = topic.problems.map((pName, idx) => {
        // Construct standard unique global ID
        const probId = `${activeLang}_${topic.id}_${pName.toLowerCase().replace(/\s+/g, '-')}`;
        const difficulty = getProblemDifficulty(pName);
        return {
          id: probId,
          title: pName,
          difficulty: difficulty,
          skill: `${LANGUAGE_DETAILS[activeLang].name} (${difficulty === 'Easy' ? 'Basic' : 'Intermediate'})`,
          maxScore: difficulty === 'Hard' ? 30 : (difficulty === 'Medium' ? 20 : 10),
          successRate: difficulty === 'Hard' ? '82.4%' : (difficulty === 'Medium' ? '91.8%' : '98.2%'),
          subdomain: topic.name.replace(/^[0-9.]+\s+/, ''), // Remove leading numbers
          status: getProblemStatus(probId)
        };
      });
      return {
        ...topic,
        problems: formattedProblems
      };
    });
  }, [activeLang, statusFilters, difficultyFilters]);

  // Active topic object helper
  const activeTopic = useMemo(() => {
    return activeCurriculum.find(topic => topic.id === activeTopicId) || activeCurriculum[0];
  }, [activeCurriculum, activeTopicId]);

  // Filtered problems inside the active selected topic
  const filteredProblems = useMemo(() => {
    if (!activeTopic) return [];
    return activeTopic.problems.filter((prob) => {
      // Status Filter
      const isStatusActive = Object.values(statusFilters).some(Boolean);
      if (isStatusActive && !statusFilters[prob.status]) return false;

      // Difficulty Filter
      const isDiffActive = Object.values(difficultyFilters).some(Boolean);
      if (isDiffActive && !difficultyFilters[prob.difficulty]) return false;

      return true;
    });
  }, [activeTopic, statusFilters, difficultyFilters]);

  // Solved and total problems calculation for active language
  const languageStats = useMemo(() => {
    let total = 0;
    let solved = 0;
    activeCurriculum.forEach(topic => {
      topic.problems.forEach(prob => {
        total++;
        if (prob.status === 'Solved') solved++;
      });
    });
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { total, solved, percentage };
  }, [activeCurriculum]);

  // Solved stats for sidebar topics
  const getTopicStats = (topic) => {
    let solved = 0;
    topic.problems.forEach(p => {
      if (p.status === 'Solved') solved++;
    });
    return {
      solved,
      total: topic.problems.length,
      isCompleted: solved === topic.problems.length
    };
  };

  // Clear filters
  const clearAllFilters = () => {
    setStatusFilters({ Solved: false, Unsolved: false });
    setDifficultyFilters({ Easy: false, Medium: false, Hard: false });
  };

  // Toggle filters
  const toggleFilter = (type, key) => {
    if (type === 'status') {
      setStatusFilters(prev => ({ ...prev, [key]: !prev[key] }));
    } else if (type === 'difficulty') {
      setDifficultyFilters(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  return (
    <section id="problems" className="relative py-24 px-6 md:px-12 bg-slate-50 dark:bg-[#080a10] border-t border-slate-200 dark:border-slate-900 transition-colors duration-300">
      
      {/* Glow Blur Blobs */}
      <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] bg-cyber-cyan/5 pointer-events-none z-0 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[20%] right-[5%] w-[350px] h-[350px] bg-cyber-purple/5 pointer-events-none z-0 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col text-left space-y-3 mb-12">
          <div className="flex items-center gap-2 text-cyber-cyan font-sans text-xs tracking-wider uppercase font-bold">
            <BookOpen className="w-4 h-4 text-cyber-cyan" />
            Curriculum learning path
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Topic Wise structured Curriculum
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-2xl font-light leading-relaxed">
            Select your target programming framework below. Master each core construct systematically from fundamentals to advanced algorithmic paradigms using 22 comprehensive, structured curricular decks.
          </p>
        </div>

        {/* Master Progress Ring Bar */}
        <div className="bg-white dark:bg-[#0e121e]/80 border border-slate-250/60 dark:border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 shadow-sm">
          <div className="space-y-1.5 text-left">
            <h4 className="font-sans font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
              Overall Language Progress: <span className="text-cyber-cyan">{LANGUAGE_DETAILS[activeLang].name}</span>
            </h4>
            <p className="text-xs text-slate-450 dark:text-slate-400 font-light">
              Complete challenges in each topic to conquer language certification badges and ranking badges!
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="font-mono text-xl font-black text-slate-800 dark:text-cyber-cyan">
                {languageStats.solved} / {languageStats.total}
              </span>
              <span className="text-[10px] uppercase font-sans font-bold text-slate-400 dark:text-slate-500 block">Challenges Solved</span>
            </div>
            
            {/* Custom progress ring bar */}
            <div className="w-36 h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 relative">
              <div 
                className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-blue transition-all duration-500" 
                style={{ width: `${languageStats.percentage}%` }}
              />
            </div>
            <span className="font-mono text-sm font-bold text-cyber-cyan w-8 text-right">{languageStats.percentage}%</span>
          </div>
        </div>

        {/* Language Tabs Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {Object.entries(LANGUAGE_DETAILS).map(([key, lang]) => (
            <button
              key={key}
              onClick={() => setActiveLang(key)}
              className={`p-5 rounded-xl border transition-all duration-200 relative group overflow-hidden cursor-pointer ${
                activeLang === key 
                  ? 'border-cyber-cyan bg-slate-100/80 dark:bg-[#121626] shadow-sm dark:shadow-md' 
                  : 'bg-white dark:bg-[#0e121e] border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-[#0e121e]/50'
              }`}
            >
              <div className="flex flex-col space-y-2 relative z-10 text-left">
                <span className="font-sans text-sm font-bold text-slate-850 dark:text-white transition-colors">
                  {lang.name}
                </span>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-light line-clamp-1">
                  {lang.tagline}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Curriculum Layout: Left Sidebar selector (22 Topics), Right Problems Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Sidebar curriculum tree selector (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col space-y-4 max-h-[680px] overflow-y-auto pr-2 bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500 px-2 pb-2 border-b border-slate-150 dark:border-slate-850 block text-left flex items-center gap-1.5">
              <ListCollapse className="w-4 h-4 text-cyber-cyan" />
              CURRICULUM CHAPTERS (22)
            </span>
            
            <div className="space-y-1">
              {activeCurriculum.map((topic) => {
                const stats = getTopicStats(topic);
                const isActive = topic.id === activeTopicId;
                
                return (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopicId(topic.id)}
                    className={`w-full p-3 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan font-bold shadow-xs' 
                        : 'border border-transparent text-slate-600 dark:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-[#121626]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyber-cyan' : 'text-slate-400 dark:text-slate-650'}`} />
                      <span className="text-xs font-sans truncate">{topic.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {stats.isCompleted ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-current dark:bg-slate-900 rounded-full" />
                      ) : (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                          {stats.solved}/{stats.total}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Topic Problems and Sidebar filters (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {/* Active Topic Header Card */}
            {activeTopic && (
              <div className="bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 p-5 rounded-xl text-left shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 bg-slate-200 dark:bg-[#121626] border-l border-b border-slate-300 dark:border-slate-800 text-slate-400 font-mono text-[8px] uppercase tracking-widest">
                  Active chapter
                </div>
                
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-sans font-bold text-cyber-cyan tracking-wider uppercase">Topic {activeTopic.name.match(/^[0-9]+/)?.[0] || '1'}</span>
                    <h3 className="font-sans font-black text-xl text-slate-850 dark:text-white leading-tight">
                      {activeTopic.name.replace(/^[0-9.]+\s+/, '')}
                    </h3>
                  </div>
                  
                  {/* Topic Progress bar */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
                      <div 
                        className="h-full bg-cyber-cyan transition-all duration-300"
                        style={{ width: `${(getTopicStats(activeTopic).solved / getTopicStats(activeTopic).total) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold shrink-0">
                      {getTopicStats(activeTopic).solved} of {getTopicStats(activeTopic).total} Solved
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Filters Bar */}
            <div className="bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-lg flex flex-wrap items-center justify-between gap-4 shadow-sm text-left">
              <div className="flex items-center gap-3">
                <span className="font-sans font-bold text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-550 flex items-center gap-1.5 shrink-0">
                  <Filter className="w-3 h-3 text-cyber-cyan" />
                  Filters:
                </span>
                
                {/* Status Toggles */}
                <div className="flex items-center gap-1.5">
                  {['Solved', 'Unsolved'].map((st) => (
                    <button
                      key={st}
                      onClick={() => toggleFilter('status', st)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                        statusFilters[st]
                          ? 'bg-cyber-cyan/15 border-cyber-cyan/35 text-cyber-cyan'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-450 hover:text-slate-800 dark:hover:text-slate-350'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-850" />

                {/* Difficulty Toggles */}
                <div className="flex items-center gap-1.5">
                  {['Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => toggleFilter('difficulty', diff)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                        difficultyFilters[diff]
                          ? 'bg-cyber-purple/15 border-cyber-purple/35 text-cyber-purple'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-450 hover:text-slate-800 dark:hover:text-slate-350'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {(Object.values(statusFilters).some(Boolean) || Object.values(difficultyFilters).some(Boolean)) && (
                <button 
                  onClick={clearAllFilters}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 text-[10px] font-bold uppercase underline underline-offset-4 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Problems List Deck */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredProblems.length > 0 ? (
                  filteredProblems.map((prob) => (
                    <motion.div
                      key={prob.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-350 dark:hover:border-slate-750 hover:bg-slate-100/30 dark:hover:bg-[#111626] shadow-sm transition-colors text-left"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-sans font-bold text-sm text-slate-800 dark:text-white">
                            {prob.title}
                          </h4>
                          <span className={`text-[8px] font-sans font-bold uppercase px-2 py-0.5 rounded ${
                            prob.difficulty === 'Easy' 
                              ? 'text-emerald-700 bg-emerald-100/50 border border-emerald-250/20 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30' 
                              : prob.difficulty === 'Medium' 
                              ? 'text-amber-700 bg-amber-100/50 border border-amber-250/20 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30' 
                              : 'text-rose-700 bg-rose-100/50 border border-rose-250/20 dark:text-rose-450 dark:bg-rose-950/20 dark:border-rose-900/30'
                          }`}>
                            {prob.difficulty}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-light">
                          <span className="flex items-center gap-1">
                            <Code className="w-3.5 h-3.5 text-cyber-purple shrink-0" />
                            {prob.skill}
                          </span>
                          <span className="h-2.5 w-[1px] bg-slate-200 dark:bg-slate-850" />
                          <span>Max Score: <strong className="text-slate-750 dark:text-slate-200">{prob.maxScore}</strong></span>
                          <span className="h-2.5 w-[1px] bg-slate-200 dark:bg-slate-850" />
                          <span>Success Rate: <strong className="text-slate-750 dark:text-slate-200">{prob.successRate}</strong></span>
                        </div>
                      </div>

                      {/* Solve Actions */}
                      <div className="flex items-center gap-3.5 self-end md:self-center shrink-0">
                        {prob.status === 'Solved' ? (
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] bg-emerald-100/50 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-900/30 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Solved
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-455 dark:text-slate-550 font-medium text-[10px] px-2 py-0.5">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-350 dark:text-slate-700" />
                            Unsolved
                          </span>
                        )}

                        <button
                          onClick={() => {
                            if (onSolveProblem) {
                              onSolveProblem({
                                id: prob.id,
                                title: prob.title,
                                difficulty: prob.difficulty,
                                subdomain: prob.subdomain,
                                skill: prob.skill,
                                maxScore: prob.maxScore
                              });
                            }
                          }}
                          className={`px-4 py-2 font-sans font-bold text-[10px] tracking-wider uppercase rounded transition-all duration-200 cursor-pointer ${
                            prob.status === 'Solved'
                              ? 'border border-emerald-500/20 hover:border-emerald-500/55 hover:bg-emerald-950/10 text-emerald-600 dark:text-emerald-300'
                              : 'bg-cyber-cyan hover:bg-[#00d6e6] text-space-900 shadow-sm'
                          }`}
                        >
                          Solve
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 p-12 rounded-xl text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
                    <Filter className="w-8 h-8 text-slate-300 dark:text-slate-700 animate-pulse" />
                    <h4 className="font-sans font-bold text-sm text-slate-800 dark:text-white">No Matching Challenges</h4>
                    <p className="text-slate-500 dark:text-slate-500 text-xs font-light max-w-xs">
                      There are no coding challenges in this chapter matching your current filters.
                    </p>
                    <button 
                      onClick={clearAllFilters}
                      className="text-cyber-cyan font-sans text-xs tracking-wider uppercase font-semibold underline underline-offset-4 cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
};

export default TopicExplorer;
