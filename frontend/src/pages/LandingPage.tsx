import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, Users, Zap as ZapIcon, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Fast & Efficient',
      description: 'Manage your projects with lightning-fast performance',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with your team members',
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Task Management',
      description: 'Organize and track tasks with ease',
    },
    {
      icon: <ZapIcon className="w-6 h-6" />,
      title: 'Real-time Updates',
      description: 'Stay synchronized with live notifications',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-surface-100 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            FlowForge
          </span>
        </div>
        <div className="flex gap-4">
          <Link
            to="/login"
            className="px-6 py-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-6 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent">
            Project Management Made Simple
          </h1>
          <p className="text-xl text-surface-600 dark:text-surface-300 mb-8 max-w-2xl mx-auto">
            FlowForge helps teams collaborate, organize tasks, and deliver projects faster with an intuitive interface and powerful features.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition flex items-center gap-2 font-medium"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 border border-brand-200 text-brand-600 rounded-lg hover:bg-brand-50 transition font-medium"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-br from-brand-100 to-brand-50 dark:from-surface-800 dark:to-surface-900 p-8 min-h-96 flex items-center justify-center">
            <div className="text-center">
              <Zap className="w-16 h-16 text-brand-500 mx-auto mb-4 opacity-50" />
              <p className="text-surface-500 dark:text-surface-400">Dashboard Preview</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Why Choose FlowForge?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="p-6 rounded-xl bg-white dark:bg-surface-800 shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-surface-600 dark:text-surface-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-brand-100 mb-8 max-w-xl mx-auto">
            Join thousands of teams using FlowForge to manage their projects efficiently.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-3 bg-white text-brand-600 rounded-lg hover:bg-brand-50 transition font-medium"
          >
            Create Your Account
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 dark:border-surface-800 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-surface-600 dark:text-surface-400 text-sm">
          <p>&copy; 2024 FlowForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
