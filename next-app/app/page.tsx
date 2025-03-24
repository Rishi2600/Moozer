import NavBar from "./(components)/NavBar"
import React from 'react';
import { Music, Play, ThumbsUp, Headphones, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return(
    <>
      <div>
        <NavBar />
      </div>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Navigation */}
      {/* <nav className="container mx-auto py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Music className="h-8 w-8 text-purple-500" />
          <span className="text-2xl font-bold">WaveStream</span>
        </div>
        <div className="hidden md:flex gap-6 font-medium">
          <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
          <a href="#discover" className="hover:text-purple-400 transition-colors">Discover</a>
          <a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</a>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="text-white hover:text-purple-400">Login</Button>
          <Button className="bg-purple-600 hover:bg-purple-700">Sign Up</Button>
        </div>
      </nav> */}

      {/* Hero Section */}
      <section className="container mx-auto py-20 px-4 md:px-0">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              Discover & Vote for <span className="text-purple-500">Music</span> You Love
            </h1>
            <p className="text-xl text-gray-300">
              Join the community where music discovery meets democracy. Listen to curated streams and help the best tracks rise to the top.
            </p>
            <div className="flex gap-4">
              <Button className="bg-purple-600 hover:bg-purple-700 text-lg px-6 py-6">
                Get Started Free
              </Button>
              <Button variant="outline" className="text-lg px-6 py-6">
                <Play className="mr-2 h-5 w-5" /> Watch Demo
              </Button>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 border-2 border-black" />
                ))}
              </div>
              <p>Join 10,000+ music lovers</p>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-75"></div>
              <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
                <img 
                  src="https://imgs.search.brave.com/BjZYdP1Th3N7uWVdti7g8Cc3GVEyMjOKAtSVUE0l1xc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90dW5l/dGFuay5pbWdpeC5u/ZXQvYWNvdXN0aWMu/anBnP2F1dG89Zm9y/bWF0Jml4bGliPXJl/YWN0LTkuMTAuMCZo/PTUxMiZ3PTUxMg" 
                  alt="WaveStream App Interface" 
                  className="w-full h-auto rounded-t-xl"
                />
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold">Currently Playing</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Cosmic Waves</h4>
                      <p className="text-gray-400">Electronic Beats</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Play className="h-6 w-6 text-purple-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <ThumbsUp className="h-5 w-5 text-purple-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-950 py-20">
        <div className="container mx-auto px-4 md:px-0">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">The Best Way to Discover Music</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              WaveStream combines community curation with powerful streaming technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Radio className="h-10 w-10 text-purple-500" />,
                title: "Live Streams",
                description: "Join curated music channels hosted by DJs and music enthusiasts"
              },
              {
                icon: <ThumbsUp className="h-10 w-10 text-purple-500" />,
                title: "Upvote System",
                description: "Like what you hear? Upvote tracks to boost them in the stream"
              },
              {
                icon: <Headphones className="h-10 w-10 text-purple-500" />,
                title: "Personalized Feed",
                description: "Discover new music based on your listening habits and votes"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Discover Section */}
      <section id="discover" className="container mx-auto py-20 px-4 md:px-0">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="relative pt-[100%]">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 opacity-80"></div>
                    <div className="absolute bottom-0 left-0 p-4">
                      <h4 className="text-lg font-bold truncate">Stream #{i}</h4>
                      <p className="text-sm text-gray-200 truncate">Genre Label</p>
                    </div>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/30 rounded-full">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div className="md:w-1/2 space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold">
              Explore Top Trending <span className="text-purple-500">Streams</span>
            </h2>
            <p className="text-xl text-gray-300">
              Dive into our most popular music streams curated by our community. From chart-topping hits to underground gems, there's something for everyone.
            </p>
            <ul className="space-y-4">
              {["Join genre-specific channels", "Follow your favorite content creators", "Create your own stream and build a following"].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center text-sm">✓</div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Browse All Streams
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-950 py-20">
        <div className="container mx-auto px-4 md:px-0">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join thousands of music enthusiasts who have found their sound on WaveStream
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex M.",
                role: "Music Producer",
                text: "WaveStream has completely changed how I discover new music. The upvoting system ensures quality tracks rise to the top."
              },
              {
                name: "Sarah K.",
                role: "Regular Listener",
                text: "I love how interactive the platform is. Being able to influence what plays next makes the experience so much more engaging."
              },
              {
                name: "Jamie T.",
                role: "Playlist Creator",
                text: "As someone who creates content, the feedback from upvotes helps me understand what my audience enjoys the most."
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800">
                <CardContent className="pt-6">
                  <p className="mb-6 text-gray-300">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500"></div>
                    <div>
                      <h4 className="font-bold">{testimonial.name}</h4>
                      <p className="text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto py-20 px-4 md:px-0">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Start for free or upgrade for premium features
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              title: "Free",
              price: "$0",
              features: [
                "Access to public streams",
                "Basic upvoting",
                "Limited skips",
                "Ad-supported listening"
              ],
              cta: "Get Started",
              highlighted: false
            },
            {
              title: "Premium",
              price: "$9.99",
              period: "per month",
              features: [
                "All Free features",
                "Unlimited skips",
                "Ad-free experience",
                "Higher quality audio",
                "Create private streams"
              ],
              cta: "Go Premium",
              highlighted: true
            },
            {
              title: "Creator",
              price: "$19.99",
              period: "per month",
              features: [
                "All Premium features",
                "Detailed listener analytics",
                "Monetization options",
                "Priority support",
                "Custom branding"
              ],
              cta: "Start Creating",
              highlighted: false
            }
          ].map((plan, index) => (
            <Card 
              key={index} 
              className={`${
                plan.highlighted 
                  ? "border-purple-500 relative shadow-lg shadow-purple-500/20" 
                  : "bg-gray-900 border-gray-800"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-max bg-purple-600 px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-4">{plan.title}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-gray-400">/{plan.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-6 text-left">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-xs mt-0.5">✓</div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${
                      plan.highlighted 
                        ? "bg-purple-600 hover:bg-purple-700" 
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-900 to-blue-900 py-20">
        <div className="container mx-auto px-4 md:px-0 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Transform Your Music Experience?</h2>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-8">
            Join thousands of users discovering and sharing music in a whole new way.
          </p>
          <Button className="bg-white text-purple-900 hover:bg-gray-100 text-lg px-8 py-6">
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-12">
        <div className="container mx-auto px-4 md:px-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-bold text-lg mb-4">WaveStream</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Products</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Desktop App</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Web Player</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Developers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Copyright</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Music className="h-6 w-6 text-purple-500" />
              <span className="text-xl font-bold">WaveStream</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 WaveStream. All rights reserved.
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Button variant="ghost" size="icon" className="rounded-full">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                </svg>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"></path>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}

//component rendering flow (keeping next-auth in mind) -> layout > providers > page > components