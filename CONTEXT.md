# Vim Puzzle Game

A web-based puzzle game that teaches vim from zero to advanced by having players solve puzzles using only vim keystrokes, with no mouse or arrow keys.

## Language

### Puzzles

**Puzzle**:
A single challenge: turn a starting buffer into a target buffer within a Keystroke Budget.
_Avoid_: Level, challenge, exercise, Navigation Puzzle, Transformation Puzzle

**Toolkit**:
The set of vim commands introduced up to a given Puzzle; its Optimal Solution uses only these, though the player may use any supported command.
_Avoid_: Unlocked commands, moveset

**Concept**:
A small group of related vim commands taught together, in a fixed order across the whole curriculum.
_Avoid_: Lesson, topic, skill

**Introductory Puzzle**:
The first Puzzle for a Concept, where the new commands are the only thing that matters.
_Avoid_: Tutorial puzzle

**Integration Puzzle**:
A Puzzle that combines a Concept's commands with those of earlier Concepts.
_Avoid_: Review puzzle

**Advanced Puzzle**:
An optional, harder Puzzle that explores a Concept's depth.
_Avoid_: Challenge puzzle, bonus

**Chapter**:
An ordered group of Concepts, unlocked by passing the previous Chapter.
_Avoid_: World, level, stage

**Test-Out Puzzle**:
A Chapter's final Puzzle, which cannot be passed without every command the Chapter introduced; passing it from the start lets an experienced player skip the Chapter.
_Avoid_: Boss, exam

### The World

**Robot Program**:
The buffer's text: code in the game's own small language that tells a Robot what to do, corrupted at the start of each Puzzle.
_Avoid_: Script, spell, source

**Scene**:
The space station beside the buffer, where the Robot acts out the Robot Program as it changes.
_Avoid_: World, map, stage

**Robot**:
A station robot the player controls remotely by repairing its Robot Program; each Puzzle has its own.
_Avoid_: Hero, player, avatar

**Objective**:
What the Robot must achieve in the Scene for its program to count as working.
_Avoid_: Task, goal, mission

### Scoring

**Keystroke Budget**:
The keystroke thresholds for a Puzzle: a pass limit, above which the Puzzle fails, and tighter limits that earn more Stars.
_Avoid_: Keystroke limit, par

**Star**:
A rating out of three for a solved Puzzle, earned by staying under the Budget's thresholds; three Stars means an optimal solution.
_Avoid_: Score, grade

**Optimal Solution**:
The shortest known keystroke sequence that solves a Puzzle; it sets the three-Star threshold.
_Avoid_: Par, best solution

### Teaching

**Helper Text**:
Guidance shown alongside a Puzzle that explains the vim commands it exercises.
_Avoid_: Lesson, tutorial, instructions

**Hint**:
An on-request nudge toward a better solution that costs the player something.
_Avoid_: Tip, clue
