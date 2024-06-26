import { Suspense, lazy } from "react";
import { RouteObject } from "react-router";

import SuspenseLoader from "./components/SuspenseLoader/index.";

const Loader = (Component: any) => (props: any) =>
  (
    <Suspense fallback={<SuspenseLoader />}>
      <Component {...props} />
    </Suspense>
  );

// pages
const Home = Loader(lazy(() => import("./pages/Home")));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
];

export default routes;
