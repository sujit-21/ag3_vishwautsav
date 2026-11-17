const mongoose = require('mongoose');

const EnrollmentSubmissionSchema = new mongoose.Schema({
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    referenceId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    type: { type: String, enum: ['festival', 'event', 'both'], default: 'festival' },
    festOrEventName: { type: String, required: true, trim: true },
    entityName: { type: String, required: true, trim: true },
    
    // Member Info
    name: { type: String, required: true, trim: true },
    roleInterest: { type: String, default: 'Committee Member', trim: true },
    departmentInterest: { type: String, default: 'Core Committee', trim: true },
    contact: { type: String, required: true, trim: true },
    countryCode: { type: String, default: '+91' },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },

    // Donation / Contribution Details
    donate: { type: Boolean, default: false },
    estimatedAmount: { type: Number, default: 0 },
    contributionItem: { type: String, trim: true }, // e.g. "Prasad / Fruits", "Stage Flowers", "Sound System"
    category: { 
        type: String, 
        enum: ['Cash', 'In-Kind Services', 'Food / Prasad', 'Stage & Sound', 'Media & Marketing', 'Logistics & Security', 'Other'], 
        default: 'Cash' 
    },
    paymentMode: { 
        type: String, 
        enum: ['Pledged', 'Cash', 'UPI / Online', 'In-Kind / Material'], 
        default: 'Pledged' 
    },

    // Status & Approval Sync
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
    },
    syncedMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    syncedSponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' },
    adminNotes: { type: String, trim: true },
    
    createdAt: { type: Date, default: Date.now }
});

EnrollmentSubmissionSchema.index({ entityName: 1, festOrEventName: 1, status: 1 });
EnrollmentSubmissionSchema.index({ slug: 1, createdAt: -1 });

module.exports = mongoose.model('EnrollmentSubmission', EnrollmentSubmissionSchema);
