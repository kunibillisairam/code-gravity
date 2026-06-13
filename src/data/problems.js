export const PROBLEMS_DB = {
  'two-sum': {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    xp: 10,
    tags: ['Arrays', 'Hash Table'],
    subdomain: 'Basic Data Types',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.\n\nYou may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.\n\nYou can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 2 + 7 == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 2 + 4 == 6, we return [1, 2].'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    testcases: [
      { id: 1, input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]', custom: false },
      { id: 2, input: 'nums = [3,2,4], target = 6', expected: '[1,2]', custom: false },
      { id: 3, input: 'nums = [3,3], target = 6', expected: '[0,1]', custom: true }
    ],
    templates: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your code here
    
}`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your code here
        pass`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[0];
    }
}`
    }
  },
  'valid-parentheses': {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    xp: 10,
    tags: ['String', 'Stack'],
    subdomain: 'Introduction',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: 'The brackets match successfully.'
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: 'All sets close cleanly.'
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: 'Mismatched closing bracket type.'
      }
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only: \'()[]{}\'.'
    ],
    testcases: [
      { id: 1, input: 's = "()"', expected: 'true', custom: false },
      { id: 2, input: 's = "()[]{}"', expected: 'true', custom: false },
      { id: 3, input: 's = "(]"', expected: 'false', custom: true }
    ],
    templates: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your code here
    
}`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Write your code here
        pass`,
      cpp: `#include <string>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Write your code here
        return false;
    }
}`
    }
  },
  'container-with-most-water': {
    id: 'container-with-most-water',
    title: 'Container With Most Water',
    difficulty: 'Medium',
    xp: 20,
    tags: ['Arrays', 'Two Pointers'],
    subdomain: 'Basic Data Types',
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`-th line are \`(i, 0)\` and \`(i, height[i])\`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn *the maximum amount of water a container can store*.\n\n**Notice** that you may not slant the container.`,
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49',
        explanation: 'The vertical lines represented by [8] and [7] form a container with width 7 and min-height 7, storing 7 * 7 = 49 units.'
      }
    ],
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4'
    ],
    testcases: [
      { id: 1, input: 'height = [1,8,6,2,5,4,8,3,7]', expected: '49', custom: false },
      { id: 2, input: 'height = [1,1]', expected: '1', custom: false }
    ],
    templates: {
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function maxArea(height) {
    // Write your code here
    
}`,
      python: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        # Write your code here
        pass`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int maxArea(vector<int>& height) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public int maxArea(int[] height) {
        // Write your code here
        return 0;
    }
}`
    }
  }
};
