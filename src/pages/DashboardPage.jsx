import { useAuth } from '../context/AuthContext';
import AgentDashboard from './AgentDashboard';
import CustomerDashboard from './CustomerDashboard';

export default function DashboardPage() {
  const { isAgent } = useAuth();
  return isAgent ? <AgentDashboard /> : <CustomerDashboard />;
}
