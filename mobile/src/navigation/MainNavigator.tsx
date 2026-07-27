import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { CommunityScreen } from "../screens/CommunityScreen";
import { CuisineDetailScreen } from "../screens/CuisineDetailScreen";
import { DiaryScreen } from "../screens/DiaryScreen";
import { DiscoverScreen } from "../screens/DiscoverScreen";
import { CookModeScreen } from "../screens/CookModeScreen";
import { CreatePostScreen } from "../screens/CreatePostScreen";
import { FriendsScreen } from "../screens/FriendsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { EditorialHomeScreen } from "../screens/EditorialHomeScreen";
import { LogMealScreen } from "../screens/LogMealScreen";
import { PlannerScreen } from "../screens/PlannerScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RecipeDetailScreen } from "../screens/RecipeDetailScreen";
import { UserProfileScreen } from "../screens/UserProfileScreen";
import { env } from "../config/env";
import { colors } from "../theme/tokens";
import { MainStackParamList, MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();
const ActiveHomeScreen =
  env.homeVariant === "editorial" ? EditorialHomeScreen : HomeScreen;

type TabIcon = keyof typeof MaterialIcons.glyphMap;
const TAB_ICONS: Record<keyof MainTabParamList, TabIcon> = {
  Home: "home",
  Discover: "explore",
  Diary: "menu-book",
  Planner: "calendar-today",
  Community: "group",
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarStyle: { backgroundColor: colors.surfaceContainerLow },
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons
            name={TAB_ICONS[route.name]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={ActiveHomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Diary" component={DiaryScreen} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="CuisineDetail"
        component={CuisineDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LogMeal"
        component={LogMealScreen}
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CookMode"
        component={CookModeScreen}
        options={{ presentation: "fullScreenModal", headerShown: false }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack.Navigator>
  );
}
