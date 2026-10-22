import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  createHashHistory,
} from "@tanstack/react-router";
import { parsePuzzleId, puzzleById } from "../content/index.ts";
import { ChaptersScreen } from "../ui/screens/chapters.tsx";
import { HomeScreen } from "../ui/screens/home.tsx";
import { PuzzleScreen } from "../ui/screens/puzzle.tsx";
import { SettingsScreen } from "../ui/screens/settings.tsx";

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundScreen,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeScreen,
});

const chaptersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chapters",
  component: ChaptersScreen,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsScreen,
});

const puzzleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/puzzle/$puzzleId",
  params: {
    parse: (params) => {
      const puzzleId = parsePuzzleId(params.puzzleId);
      return puzzleId ? { puzzleId } : false;
    },
    stringify: ({ puzzleId }) => ({ puzzleId }),
  },
  component: PuzzleRoute,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  chaptersRoute,
  settingsRoute,
  puzzleRoute,
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function PuzzleRoute() {
  const { puzzleId } = puzzleRoute.useParams();
  const puzzle = puzzleById.get(puzzleId);
  if (!puzzle) return <NotFoundScreen />;
  return <PuzzleScreen puzzle={puzzle} />;
}

function NotFoundScreen() {
  return (
    <main className="not-found">
      <p className="eyebrow">UPLINK LOST</p>
      <h1>Route not found</h1>
      <Link to="/" className="primary-action">
        Return to station
      </Link>
    </main>
  );
}
