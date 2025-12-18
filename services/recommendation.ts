import { Project, UserProfile } from '../types';

/**
 * A simple content-based filtering recommendation algorithm.
 * It scores projects based on:
 * 1. Interest Match: Overlap between user interests and project tags.
 * 2. Skill Match: Appropriateness of difficulty for user's skill level.
 * 3. Popularity: Slight boost for highly liked projects.
 * 4. Discovery: Random noise to ensure variety.
 */
export const getRecommendedProjects = (user: UserProfile, projects: Project[]): Project[] => {
  const scoredProjects = projects.map(project => {
    let score = 0;

    // 1. Interest Match (Weight: High)
    // +10 points for each matching tag
    const matchingTags = project.tags.filter(tag => 
      user.interests.some(interest => interest.toLowerCase() === tag.toLowerCase())
    );
    score += matchingTags.length * 10;

    // 2. Skill/Difficulty Match (Weight: Medium)
    // +15 points for perfect match
    // +5 points for adjacent match (e.g. Beginner -> Easy/Medium is okay)
    const difficultyMap: Record<string, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    const skillMap: Record<string, number> = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
    
    const diffScore = difficultyMap[project.difficulty] || 2;
    const userSkill = skillMap[user.skillLevel] || 1;
    const gap = Math.abs(diffScore - userSkill);

    if (gap === 0) score += 15;
    else if (gap === 1) score += 5;
    else score -= 10; // Too hard or too easy

    // 3. Popularity Boost (Weight: Low)
    // Normalize likes (assuming max likes ~50k for this mock)
    score += (project.likes / 50000) * 5;

    // 4. Random Discovery Factor (Weight: Variable)
    // Adds -5 to +5 randomness to keep the feed fresh
    score += (Math.random() * 10) - 5;

    return { ...project, _score: score, _matchReasons: matchingTags };
  });

  // Sort by score descending
  return scoredProjects
    .sort((a, b) => b._score - a._score)
    .map(({ _score, _matchReasons, ...original }) => original);
};
