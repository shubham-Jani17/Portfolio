from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///portfolio.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
CORS(app)

# DATABASE MODELS 

class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    bio = db.Column(db.Text)
    subtitle1 = db.Column(db.String(100))
    subtitle2 = db.Column(db.String(100))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'bio': self.bio,
            'subtitle1': self.subtitle1,
            'subtitle2': self.subtitle2
        }

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(100))
    technologies = db.Column(db.Text)
    github = db.Column(db.String(200))
    demo = db.Column(db.String(200))
    status = db.Column(db.String(50), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'technologies': self.technologies,
            'github': self.github,
            'demo': self.demo,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Skill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Inquiry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='unread')
    date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'message': self.message,
            'status': self.status,
            'date': self.date.isoformat() if self.date else None
        }

class Social(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    github = db.Column(db.String(200))
    linkedin = db.Column(db.String(200))
    twitter = db.Column(db.String(200))
    portfolio = db.Column(db.String(200))
    
    def to_dict(self):
        return {
            'id': self.id,
            'github': self.github,
            'linkedin': self.linkedin,
            'twitter': self.twitter,
            'portfolio': self.portfolio
        }

#  API ROUTES 

# Profile Routes
@app.route('/api/profile', methods=['GET'])
def get_profile():
    profile = Profile.query.first()
    if not profile:
        return jsonify({'data': None, 'message': 'Profile not found'}), 404
    return jsonify({'data': profile.to_dict()})

@app.route('/api/profile', methods=['PUT'])
def update_profile():
    data = request.get_json()
    profile = Profile.query.first()
    
    if not profile:
        profile = Profile()
        db.session.add(profile)
    
    profile.name = data.get('name', profile.name)
    profile.email = data.get('email', profile.email)
    profile.bio = data.get('bio', profile.bio)
    profile.subtitle1 = data.get('subtitle1', profile.subtitle1)
    profile.subtitle2 = data.get('subtitle2', profile.subtitle2)
    
    db.session.commit()
    return jsonify({'data': profile.to_dict(), 'message': 'Profile updated successfully'})

# Projects Routes
@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = Project.query.order_by(Project.created_at.desc()).all()
    return jsonify({'data': [p.to_dict() for p in projects]})

@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    return jsonify({'data': project.to_dict()})

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    
    project = Project(
        name=data['name'],
        description=data['description'],
        icon=data.get('icon', 'fas fa-project-diagram'),
        technologies=data.get('technologies', ''),
        github=data.get('github', ''),
        demo=data.get('demo', ''),
        status=data.get('status', 'active')
    )
    
    db.session.add(project)
    db.session.commit()
    
    return jsonify({'data': project.to_dict(), 'message': 'Project created successfully'}), 201

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json()
    
    project.name = data.get('name', project.name)
    project.description = data.get('description', project.description)
    project.icon = data.get('icon', project.icon)
    project.technologies = data.get('technologies', project.technologies)
    project.github = data.get('github', project.github)
    project.demo = data.get('demo', project.demo)
    project.status = data.get('status', project.status)
    
    db.session.commit()
    return jsonify({'data': project.to_dict(), 'message': 'Project updated successfully'})

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted successfully'})

# Skills Routes
@app.route('/api/skills', methods=['GET'])
def get_skills():
    skills = Skill.query.order_by(Skill.created_at.desc()).all()
    return jsonify({'data': [s.to_dict() for s in skills]})

@app.route('/api/skills/<int:skill_id>', methods=['GET'])
def get_skill(skill_id):
    skill = Skill.query.get_or_404(skill_id)
    return jsonify({'data': skill.to_dict()})

@app.route('/api/skills', methods=['POST'])
def create_skill():
    data = request.get_json()
    
    skill = Skill(
        name=data['name'],
        description=data['description'],
        icon=data['icon']
    )
    
    db.session.add(skill)
    db.session.commit()
    
    return jsonify({'data': skill.to_dict(), 'message': 'Skill created successfully'}), 201

@app.route('/api/skills/<int:skill_id>', methods=['PUT'])
def update_skill(skill_id):
    skill = Skill.query.get_or_404(skill_id)
    data = request.get_json()
    
    skill.name = data.get('name', skill.name)
    skill.description = data.get('description', skill.description)
    skill.icon = data.get('icon', skill.icon)
    
    db.session.commit()
    return jsonify({'data': skill.to_dict(), 'message': 'Skill updated successfully'})

@app.route('/api/skills/<int:skill_id>', methods=['DELETE'])
def delete_skill(skill_id):
    skill = Skill.query.get_or_404(skill_id)
    db.session.delete(skill)
    db.session.commit()
    return jsonify({'message': 'Skill deleted successfully'})

# Inquiries Routes
@app.route('/api/inquiries', methods=['GET'])
def get_inquiries():
    inquiries = Inquiry.query.order_by(Inquiry.date.desc()).all()
    return jsonify({'data': [i.to_dict() for i in inquiries]})

@app.route('/api/inquiries/<int:inquiry_id>', methods=['GET'])
def get_inquiry(inquiry_id):
    inquiry = Inquiry.query.get_or_404(inquiry_id)
    return jsonify({'data': inquiry.to_dict()})

@app.route('/api/inquiries', methods=['POST'])
def create_inquiry():
    data = request.get_json()
    
    inquiry = Inquiry(
        name=data['name'],
        email=data['email'],
        message=data['message'],
        status='unread'
    )
    
    db.session.add(inquiry)
    db.session.commit()
    
    return jsonify({'data': inquiry.to_dict(), 'message': 'Inquiry submitted successfully'}), 201

@app.route('/api/inquiries/<int:inquiry_id>/status', methods=['PUT'])
def update_inquiry_status(inquiry_id):
    inquiry = Inquiry.query.get_or_404(inquiry_id)
    data = request.get_json()
    
    inquiry.status = data.get('status', inquiry.status)
    
    db.session.commit()
    return jsonify({'data': inquiry.to_dict(), 'message': 'Inquiry status updated successfully'})

@app.route('/api/inquiries/<int:inquiry_id>', methods=['DELETE'])
def delete_inquiry(inquiry_id):
    inquiry = Inquiry.query.get_or_404(inquiry_id)
    db.session.delete(inquiry)
    db.session.commit()
    return jsonify({'message': 'Inquiry deleted successfully'})

# Social Links Routes
@app.route('/api/social', methods=['GET'])
def get_social():
    social = Social.query.first()
    if not social:
        return jsonify({'data': None, 'message': 'Social links not found'}), 404
    return jsonify({'data': social.to_dict()})

@app.route('/api/social', methods=['PUT'])
def update_social():
    data = request.get_json()
    social = Social.query.first()
    
    if not social:
        social = Social()
        db.session.add(social)
    
    social.github = data.get('github', social.github)
    social.linkedin = data.get('linkedin', social.linkedin)
    social.twitter = data.get('twitter', social.twitter)
    social.portfolio = data.get('portfolio', social.portfolio)
    
    db.session.commit()
    return jsonify({'data': social.to_dict(), 'message': 'Social links updated successfully'})

# Error Handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# Initialize Database
def init_db():
    with app.app_context():
        db.create_all()
        
        # Create default profile if not exists
        if not Profile.query.first():
            profile = Profile(
                name='Shubham Jani',
                email='shubhamjani1731@gmail.com',
                bio='Passionate software developer and problem solver.',
                subtitle1='Software Developer',
                subtitle2='Problem Solver'
            )
            db.session.add(profile)
        
        
        if not Social.query.first():
            social = Social(
                github='https://github.com/shubham-Jani17',
                linkedin='https://linkedin.com',
                twitter='',
                portfolio=''
            )
            db.session.add(social)
        
        db.session.commit()
        print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
