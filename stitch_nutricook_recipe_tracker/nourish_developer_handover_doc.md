# Nourish Product Specification & Developer Handover

## 1. Product Overview
**Nourish** is a mobile-first "supportive kitchen friend" that blends automated calorie tracking, personalized meal planning, and social accountability. Unlike clinical trackers, Nourish focuses on the *craft* of cooking and the *reward* of community.

## 2. Core User Flows
### A. Onboarding & Personalization
*   **Initial Setup**: Users define goals (Weight Loss, Gain, Maintenance) and dietary preferences (Keto, Vegan, etc.).
*   **Dynamic Calorie Targeting**: System calculates TDEE based on user metrics and activity level.
*   **Deferred Registration**: Onboarding is "value-first." Account creation is only required to sync data or access social features.

### B. The Social "Cooking Streak"
*   **Meal Snaps**: Ephemeral, view-once photos of cooked meals.
*   **Streaks**: Consecutive days of cooking/logging shared with specific friends.
*   **Community Hub**: A feed for discovery, friend activity, and "nudging" friends to maintain their streaks.

### C. Meal Planning & Tracking
*   **Weekly Planner**: Users schedule recipes for the week.
*   **Daily Diary**: Real-time calorie and macro tracking with a focus on "remaining" budget.
*   **Recipe Detail**: Step-by-step interactive cooking mode with "Add All" grocery integration.

## 3. Functional Requirements
### FR-1: Calorie Engine
*   The system must calculate a daily calorie goal based on the Mifflin-St Jeor Equation.
*   The system must support manual logging of "Quick Meals" and automated logging from the "Meal Planner."
*   The system must track Macronutrients (Protein, Carbs, Fats) and Water Intake.

### FR-2: Social & Camera
*   Integration with system camera for "Snap Share."
*   Implementation of an ephemeral storage logic for "Meal Snaps" (24-hour expiration).
*   Real-time streak counter for peer-to-peer connections.

### FR-3: Recipe Management
*   Searchable database with filters for dietary preferences (tagged in onboarding).
*   "Start Cooking" interactive mode that keeps the screen awake during preparation.

## 4. Non-Functional Requirements
### NFR-1: Performance
*   App launch to Home screen in < 2 seconds.
*   Camera shutter latency < 200ms for "Snap" experience.

### NFR-2: Scalability & Reliability
*   Support for 10k+ concurrent users in the Community Hub feed.
*   99.9% uptime for the Calorie Engine and User Data sync.

### NFR-3: Security & Privacy
*   OAuth 2.0 for Google/Social login.
*   End-to-end encryption for private "Send to Friend" messages.
*   GDPR compliance for health data and user metrics.

## 5. Visual Language (Vibrant Hearth)
*   **Typography**: Playfair Display (Headlines), Sans-serif (UI/Body).
*   **Color Palette**: Nature-inspired greens (#6b8e6b), warm creams, and high-contrast accents.
*   **Shape**: Soft, rounded corners (8px-16px) to maintain the "supportive friend" tone.

## 6. Development Milestones
*   **Phase 1**: Core Calorie Engine & Onboarding.
*   **Phase 2**: Recipe Library & Meal Planner.
*   **Phase 3**: Camera Integration & Social Hub.
*   **Phase 4**: Notifications & Engagement Loops (Nudges).
