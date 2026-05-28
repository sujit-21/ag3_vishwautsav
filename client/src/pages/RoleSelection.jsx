import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, UserCircle, ArrowRight } from 'lucide-react'
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
            icon: <ShieldCheck size={28} />,
            color: '#c084fc'
        },
        {
            id: 'user',
            title: 'Standard User',
            subtitle: 'Participant Portal',
            desc: 'Browse festivals, view events, and verify member record details by ID.',
            icon: <UserCircle size={28} />,
            color: '#22d3ee'
        }
    ]

    return (
        <div className="role-selection-page min-vh-100 d-flex align-items-center py-5" style={{ background: 'var(--primary-bg)' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <div className="text-center mb-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="display-6 fw-extrabold text-main mb-2">Welcome, <span className="gradient-text">{user?.name}</span></h1>
                        <p className="text-muted fs-6">Select your access profile to continue session</p>
                    </motion.div>
                </div>

                <div className="row g-4 justify-content-center">
                    {roles.map((role, idx) => (
                        <div key={role.id} className="col-md-5">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => handleRoleSelect(role.id)}
                                className="h-100"
                            >
                                <div 
                                    className="shortcut-card p-4 h-100 cursor-pointer text-start d-flex flex-column"
                                    style={{ 
                                        '--card-accent': role.color,
                                        '--card-accent-glow': `${role.color}25`,
                                        borderColor: user?.role === role.id ? role.color : 'var(--glass-border)',
                                        borderWidth: '1.5px',
                                        borderStyle: 'solid',
                                        boxShadow: user?.role === role.id ? `0 0 25px ${role.color}20` : 'none'
                                    }}
                                >
                                    <div 
                                        className="d-flex align-items-center justify-content-center rounded-3 mb-3" 
                                        style={{ 
                                            width: '52px', 
                                            height: '52px', 
                                            backgroundColor: `${role.color}15`,
                                            color: role.color,
                                            border: `1.5px solid ${role.color}30`
                                        }}
                                    >
                                        {role.icon}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div 
                                            className="tiny uppercase fw-bold ls-1 mb-1" 
                                            style={{ color: role.color }}
                                        >
                                            {role.subtitle}
                                        </div>
                                        <h4 className="fw-extrabold mb-2" style={{ color: 'var(--text-main)' }}>
                                            {role.title}
                                        </h4>
                                        <p className="tiny mb-3" style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                            {role.desc}
                                        </p>
                                    </div>
                                    <div 
                                        className="mt-auto d-flex align-items-center gap-2 fw-bold small uppercase ls-1"
                                        style={{ color: role.color }}
                                    >
                                        Proceed to Workspace <ArrowRight size={14} className="arrow-icon" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
                
                <div className="text-center mt-4 pt-2">
                    <p className="tiny text-muted uppercase ls-2 fw-bold">Note: You can switch between roles anytime via the navigation bar.</p>
                </div>
            </div>
        </div>
    )
}

export default RoleSelection
