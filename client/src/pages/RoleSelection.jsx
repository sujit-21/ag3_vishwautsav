import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, ShieldCheck, UserCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const RoleSelection = () => {
    const { switchRole, user, setVerifiedEntity } = useAuth()
    const navigate = useNavigate()

    const handleRoleSelect = async (role) => {
        await switchRole(role)
        if (role === 'admin') {
            // Clear any stale entity from previous session, then go to entity selection
            setVerifiedEntity(null)
            navigate('/verify-entity')
        } else {
            navigate('/my-pass')
        }
    }

    const roles = [
        {
            id: 'admin',
            title: 'Administrator',
            subtitle: 'Management Console',
            desc: 'Access full administrative controls, financial reports, and entity management.',
            icon: <ShieldCheck size={48} />,
            color: 'var(--accent-1)',
            theme: 'bg-primary bg-opacity-10 text-primary border-primary'
        },
        {
            id: 'user',
            title: 'Standard User',
            subtitle: 'Participant Portal',
            desc: 'Browse festivals, view events, and verify member record details by ID.',
            icon: <UserCircle size={48} />,
            color: 'var(--accent-2)',
            theme: 'bg-info bg-opacity-10 text-info border-info'
        }
    ]

    return (
        <div className="role-selection-page min-vh-100 d-flex align-items-center py-5" style={{ background: 'var(--primary-bg)' }}>
            <div className="container">
                <div className="text-center mb-5">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="display-5 fw-extrabold text-main mb-2">Welcome, <span className="gradient-text">{user?.name}</span></h1>
                        <p className="text-muted fs-5">Select your access profile to continue session</p>
                    </motion.div>
                </div>

                <div className="row g-4 justify-content-center">
                    {roles.map((role, idx) => (
                        <div key={role.id} className="col-md-5">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ y: -10 }}
                                onClick={() => handleRoleSelect(role.id)}
                            >
                                <div 
                                    className={`glass-card-premium p-5 h-100 cursor-pointer border-2 transition-all ${user?.role === role.id ? 'border-primary' : 'border-white border-opacity-10'}`}
                                    style={{ 
                                        boxShadow: user?.role === role.id ? '0 0 40px rgba(13, 110, 253, 0.2)' : 'none',
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)'
                                    }}
                                >
                                    <div className={`p-4 rounded-4 mb-4 d-inline-flex align-items-center justify-content-center ${role.theme}`}>
                                        {role.icon}
                                    </div>
                                    <div className="mb-4">
                                        <div className="tiny uppercase fw-bold ls-2 text-primary mb-1">{role.subtitle}</div>
                                        <h2 className="fw-extrabold text-main mb-3">{role.title}</h2>
                                        <p className="text-muted mb-0 fs-6 lh-base">{role.desc}</p>
                                    </div>
                                    <div className="mt-4 d-flex align-items-center gap-2 text-primary fw-bold text-uppercase ls-1">
                                        Proceed to Workspace <ArrowRight size={18} />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
                
                <div className="text-center mt-5 pt-4">
                    <p className="tiny text-muted uppercase ls-2 fw-bold">Note: You can switch between roles anytime via the navigation bar.</p>
                </div>
            </div>
        </div>
    )
}

export default RoleSelection
