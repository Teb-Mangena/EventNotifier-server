import Opportunity from '../models/opportunityModel.js';
import User from '../models/userModel.js';
import sendEmail from '../utils/emailService.js';
import { format } from 'date-fns';

export const createOpportunity = async (req, res, next) => {
  try {
    const {
      title,
      organization,
      category,
      location,
      commitment,
      duration,
      description,
      skills
    } = req.body;

    // Create the opportunity
    const opportunity = await Opportunity.create(req.body);

    // Get all user emails
    const users = await User.find({}, 'email name -_id'); 
    const emailList = users.map(u => ({ email: u.email, name: u.name })).filter(u => u.email);

    if (emailList.length === 0) {
      console.warn('⚠️ No user emails found');
      return res.status(201).json({ success: true, data: opportunity });
    }

    // Format dates for readability
    const formattedDate = format(new Date(), "EEEE, MMMM do, yyyy 'at' h:mm a");

    // Email body content
    const plainTextMessage = `Hello!

A new opportunity has just been posted on ${formattedDate}:

${title}
${organization} - ${category}

${description}

📍 Location: ${location}
⏰ Commitment: ${commitment}
📅 Duration: ${duration}
🛠️ Skills: ${skills.join(', ')}

Check it out on our platform!`;

    const htmlMessage = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 5px 5px;
            border: 1px solid #ddd;
            border-top: none;
          }
          .opportunity-details {
            margin: 15px 0;
          }
          .detail-item {
            margin-bottom: 10px;
          }
          .detail-label {
            font-weight: bold;
            color: #2c3e50;
          }
          .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
          }
          .skill-tag {
            background-color: #e7f4ff;
            color: #2c3e50;
            padding: 4px 8px;
            border-radius: 15px;
            font-size: 0.9em;
          }
          .button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 0.9em;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Opportunity Available!</h1>
          <p>Posted on ${formattedDate}</p>
        </div>
        
        <div class="content">
          <h2>${title}</h2>
          <h3>${organization} • ${category}</h3>
          
          <div class="opportunity-details">
            <p>${description}</p>
            
            <div class="detail-item">
              <span class="detail-label">📍 Location:</span> ${location}
            </div>
            
            <div class="detail-item">
              <span class="detail-label">⏰ Commitment:</span> ${commitment}
            </div>
            
            <div class="detail-item">
              <span class="detail-label">📅 Duration:</span> ${duration}
            </div>
            
            <div class="detail-item">
              <span class="detail-label">🛠️ Required Skills:</span>
              <div class="skills">
                ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
              </div>
            </div>
          </div>
          
          <a href="${process.env.FRONTEND_URL || 'https://yourappdomain.com'}/opportunities/${opportunity._id}" class="button">
            View Opportunity Details
          </a>
          
          <div class="footer">
            <p>You're receiving this email because you're subscribed to ${process.env.APP_NAME || 'Our Platform'} notifications.</p>
            <p><a href="${process.env.FRONTEND_URL || 'https://yourappdomain.com'}/preferences">Manage notification preferences</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails individually
    const emailPromises = emailList.map(user => 
      sendEmail({
        to: user.email,
        subject: `🎯 New Opportunity: ${title} - ${organization}`,
        text: plainTextMessage,
        html: htmlMessage
      }).catch(err => {
        console.error(`❌ Email to ${user.email} failed: ${err.message}`);
        // Don't throw error to prevent breaking the loop for other emails
      })
    );

    // Wait for all emails to be sent (or fail individually)
    await Promise.all(emailPromises);

    console.log(`✅ Opportunity created and ${emailList.length} notification emails sent`);

    return res.status(201).json({ success: true, data: opportunity });

  } catch (error) {
    next(error);
  }
};

/**
 * Get all opportunities, with optional filtering and pagination
 */
export const getOpportunities = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, location } = req.query;

    // Build filter object dynamically
    const filter = {};
    if (category) filter.category = category;
    if (location) filter.location = location;

    const opportunities = await Opportunity.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    const total = await Opportunity.countDocuments(filter);

    return res.status(200).json({
      success: true,
      meta: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / limit)
      },
      data: opportunities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single opportunity by ID
 */
export const getOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const opportunity = await Opportunity.findById(id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: `Opportunity not found with id ${id}`
      });
    }

    return res.status(200).json({ success: true, data: opportunity });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing opportunity
 */
export const updateOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const opportunity = await Opportunity.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: `Opportunity not found with id ${id}`
      });
    }

    return res.status(200).json({ success: true, data: opportunity });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an opportunity
 */
export const deleteOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const opportunity = await Opportunity.findByIdAndDelete(id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: `Opportunity not found with id ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: {},
      message: 'Opportunity deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
