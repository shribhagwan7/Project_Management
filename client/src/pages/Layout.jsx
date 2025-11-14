import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadTheme } from "../features/themeSlice";
import { Loader2Icon } from "lucide-react";
import {
  useUser,
  SignIn,
  useAuth,
  CreateOrganization,
  useOrganizationList,
} from "@clerk/clerk-react";
import { fetchWorkspaces } from "../features/workspaceSlice";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { loading: wsLoading, workspaces } = useSelector(
    (state) => state.workspace || { loading: false, workspaces: [] }
  );
  const dispatch = useDispatch();

  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();

  // Clerk org list hook (may be undefined on very old Clerk SDKs)
  let orgHook;
  try {
    orgHook = useOrganizationList ? useOrganizationList() : null;
  } catch (e) {
    orgHook = null;
  }

  const orgLoaded = orgHook?.isLoaded ?? true;
  const organizationList = orgHook?.organizationList ?? orgHook?.data ?? [];

  const location = useLocation();
  const navigate = useNavigate();

  // read ?org_created=1 flag from URL
  const searchParams = new URLSearchParams(location.search);
  const urlHasOrgCreated = searchParams.get("org_created") === "1";

  // local flag to avoid showing CreateOrganization again after redirect
  const [orgCreatedFlag, setOrgCreatedFlag] = useState(urlHasOrgCreated);

  useEffect(() => {
    dispatch(loadTheme());
  }, [dispatch]);

  // when user becomes available, always try to load workspaces
  useEffect(() => {
    if (userLoaded && user) {
      dispatch(fetchWorkspaces({ getToken }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoaded, user]);

  // If URL contains org_created=1, remove it from address bar (clean URL)
  useEffect(() => {
    if (urlHasOrgCreated) {
      // set local flag so we don't show CreateOrganization even if org list hasn't propagated yet
      setOrgCreatedFlag(true);

      // remove query param without reloading page
      searchParams.delete("org_created");
      const newSearch = searchParams.toString();
      const newPath =
        location.pathname + (newSearch.length ? `?${newSearch}` : "");
      navigate(newPath, { replace: true });

      // extra: immediately refetch workspaces (server might have created new workspace)
      dispatch(fetchWorkspaces({ getToken }));

      // small polling: try refetching workspaces a few times (3 times) to let backend/Clerk propagate
      let attempts = 0;
      const intervalId = setInterval(() => {
        attempts += 1;
        dispatch(fetchWorkspaces({ getToken }));
        if (attempts >= 3) clearInterval(intervalId);
      }, 2000);
      return () => clearInterval(intervalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlHasOrgCreated, location.pathname]); // run when landing with ?org_created

  // --- UI states ---
  if (!userLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <Loader2Icon className="size-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-zinc-950">
        <SignIn afterSignInUrl="/" />
      </div>
    );
  }

  // If Clerk org data is loaded and it's really empty, show CreateOrganization.
  // BUT do NOT show CreateOrganization if we have the orgCreatedFlag set (that means user just created org and we are waiting propagation).
  if (Array.isArray(organizationList) && organizationList.length === 0 && !orgCreatedFlag) {
    // pass afterCreateOrganizationUrl to add ?org_created=1 so we can detect after redirect
    return (
      <div className="min-h-screen flex justify-center items-center">
        <CreateOrganization afterCreateOrganizationUrl="/?org_created=1" />
      </div>
    );
  }

  // If backend workspaces still loading, show loader
  if (wsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <Loader2Icon className="size-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Normal layout
  return (
    <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col h-screen">
        <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
