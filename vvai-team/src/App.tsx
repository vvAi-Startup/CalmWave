import Hero from './sections/Hero'
import Navbar from './components/Navbar'
import About from './sections/About'
import Team from './sections/Team'
import Projects from './sections/Projects'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import AnimatedSection from './components/AnimatedSection'

function App() {
  return (
    <main className="min-h-screen relative">
      <CustomCursor />
      <Navbar />

      <Hero />  
      <AnimatedSection>
        <About />
      </AnimatedSection>
      <AnimatedSection>
        <Team />
      </AnimatedSection>
      <AnimatedSection>
        <Projects />
      </AnimatedSection>
      <AnimatedSection>
        <Footer />
      </AnimatedSection>
    </main>
  )
}

export default App