import { useEffect, useState } from "react";
import { useOrganization } from "@clerk/clerk-react";
import { Search, UserPlus, Users, Activity, Shield } from "lucide-react";
import InviteMemberDialog from "../components/InviteMemberDialog";

const Team = () => {
  const { organization } = useOrganization();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 🔄 Fetch organization members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!organization) return;
      try {
        setIsLoading(true);
        const response = await organization.getMemberships();
        setMembers(response?.data || []);
      } catch (error) {
        console.error("Error fetching members:", error);
        setMembers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [organization]);

  // 🔁 Refresh after inviting new member
  const handleInviteSuccess = async () => {
    if (!organization) return;
    const updatedMembers = await organization.getMemberships();
    setMembers(updatedMembers?.data || []);
  };

  const filteredMembers = members.filter((member) =>
    member.publicUserData?.firstName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 text-zinc-900 dark:text-zinc-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-sm text-zinc-500">
            Manage team members and their contributions
          </p>
        </div>

        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Total Members</p>
            <h2 className="text-2xl font-semibold">{members.length}</h2>
          </div>
          <Users className="w-8 h-8 text-blue-500" />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Active Projects</p>
            <h2 className="text-2xl font-semibold">2</h2>
          </div>
          <Activity className="w-8 h-8 text-green-500" />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Total Tasks</p>
            <h2 className="text-2xl font-semibold">0</h2>
          </div>
          <Shield className="w-8 h-8 text-purple-500" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search team members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
            <tr>
              <th className="py-3 px-5 text-left">Name</th>
              <th className="py-3 px-5 text-left">Email</th>
              <th className="py-3 px-5 text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan="3"
                  className="py-5 text-center text-zinc-500 dark:text-zinc-400"
                >
                  Loading members...
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td
                  colSpan="3"
                  className="py-5 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No members found.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const email =
                  member.publicUserData?.emailAddress ||
                  member.publicUserData?.identifier ||
                  "No email";

                return (
                  <tr
                    key={member.id}
                    className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition"
                  >
                    <td className="py-3 px-5 flex items-center gap-3">
                      <img
                        src={member.publicUserData?.imageUrl}
                        alt="avatar"
                        className="w-8 h-8 rounded-full border border-zinc-300 dark:border-zinc-700"
                      />
                      {member.publicUserData?.firstName ||
                        member.publicUserData?.identifier ||
                        "Unknown"}
                    </td>
                    <td className="py-3 px-5 text-zinc-600 dark:text-zinc-400">
                      {email}
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full ${
                          member.role === "org:admin"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {member.role === "org:admin" ? "ADMIN" : "MEMBER"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        onInviteSuccess={handleInviteSuccess}
      />
    </div>
  );
};

export default Team;