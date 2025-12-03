import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GradientButton,
  IconCircle,
  FeatureBadge,
  CleanModeCard,
  CleanModeCardHeader,
  CleanModeCardTitle,
  CleanModeCardContent,
} from '@rana/ui';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 dark:from-purple-950 dark:via-pink-950 dark:to-orange-950">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            RANA UI Examples
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Beautiful glass morphism components for React
          </p>
        </div>

        {/* Glass Cards */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
            Glass Cards
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard hover="lift">
              <GlassCardHeader>
                <GlassCardTitle>Default Glass</GlassCardTitle>
                <GlassCardDescription>
                  Beautiful frosted glass effect
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  This card uses the default glass morphism style with subtle backdrop blur.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard variant="tinted" hover="lift">
              <GlassCardHeader>
                <GlassCardTitle>Tinted Glass</GlassCardTitle>
                <GlassCardDescription>
                  With gradient tint
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  This variant adds a beautiful gradient tint to the glass effect.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard variant="frosted" shadow="xl" hover="glow">
              <GlassCardHeader>
                <GlassCardTitle>Frosted Glass</GlassCardTitle>
                <GlassCardDescription>
                  Extra frosted effect
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  More blur for a stronger frosted glass appearance.
                </p>
              </GlassCardContent>
            </GlassCard>
          </div>
        </section>

        {/* Gradient Buttons */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
            Gradient Buttons
          </h2>
          <div className="flex flex-wrap gap-4">
            <GradientButton variant="purple">Purple Gradient</GradientButton>
            <GradientButton variant="orange">Orange Gradient</GradientButton>
            <GradientButton variant="blue">Blue Gradient</GradientButton>
            <GradientButton variant="green">Green Gradient</GradientButton>
            <GradientButton variant="outline">Outline</GradientButton>
            <GradientButton variant="ghost">Ghost</GradientButton>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <GradientButton size="sm">Small</GradientButton>
            <GradientButton size="md">Medium</GradientButton>
            <GradientButton size="lg">Large</GradientButton>
            <GradientButton size="xl">Extra Large</GradientButton>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <GradientButton animation="glow">Glow Effect</GradientButton>
            <GradientButton animation="pulse">Pulse Animation</GradientButton>
          </div>
        </section>

        {/* Icon Circles */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
            Icon Circles
          </h2>
          <div className="flex flex-wrap gap-6">
            <IconCircle variant="purple" hover="scale">
              ✨
            </IconCircle>
            <IconCircle variant="orange" hover="scale">
              🚀
            </IconCircle>
            <IconCircle variant="blue" hover="scale">
              💎
            </IconCircle>
            <IconCircle variant="green" hover="scale">
              🎯
            </IconCircle>
            <IconCircle variant="glass" size="lg" hover="lift">
              🎨
            </IconCircle>
            <IconCircle variant="outline" size="xl" hover="rotate">
              🔥
            </IconCircle>
          </div>
        </section>

        {/* Feature Badges */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
            Feature Badges
          </h2>
          <div className="flex flex-wrap gap-4">
            <FeatureBadge variant="gradient" hover="glow">
              Gradient Badge
            </FeatureBadge>
            <FeatureBadge variant="glass" hover="lift">
              Glass Badge
            </FeatureBadge>
            <FeatureBadge variant="outline" hover="scale">
              Outline Badge
            </FeatureBadge>
            <FeatureBadge variant="solid">Solid Badge</FeatureBadge>
            <FeatureBadge variant="soft">Soft Badge</FeatureBadge>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <FeatureBadge size="sm" icon="✨">
              Small
            </FeatureBadge>
            <FeatureBadge size="md" icon="🚀">
              Medium
            </FeatureBadge>
            <FeatureBadge size="lg" icon="💎">
              Large
            </FeatureBadge>
          </div>
        </section>

        {/* Clean Mode Cards */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
            Clean Mode Cards
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <CleanModeCard variant="clean" showAccent accentColor="purple">
              <CleanModeCardHeader>
                <CleanModeCardTitle>Clean Design</CleanModeCardTitle>
              </CleanModeCardHeader>
              <CleanModeCardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Minimal, clean card with subtle gradient accent.
                </p>
              </CleanModeCardContent>
            </CleanModeCard>

            <CleanModeCard variant="focus" hover="subtle">
              <CleanModeCardHeader>
                <CleanModeCardTitle>Focus Mode</CleanModeCardTitle>
              </CleanModeCardHeader>
              <CleanModeCardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Card with left accent border for focused content.
                </p>
              </CleanModeCardContent>
            </CleanModeCard>

            <CleanModeCard variant="zen" showAccent accentColor="blue">
              <CleanModeCardHeader>
                <CleanModeCardTitle>Zen Mode</CleanModeCardTitle>
              </CleanModeCardHeader>
              <CleanModeCardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Ultra minimal design for distraction-free interfaces.
                </p>
              </CleanModeCardContent>
            </CleanModeCard>

            <CleanModeCard variant="minimal" hover="lift">
              <CleanModeCardHeader>
                <CleanModeCardTitle>Minimal</CleanModeCardTitle>
              </CleanModeCardHeader>
              <CleanModeCardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Simplest card variant with clean borders.
                </p>
              </CleanModeCardContent>
            </CleanModeCard>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-gray-300 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Built with{' '}
            <a
              href="https://github.com/waymaker-ai/ranavibe"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              RANA UI
            </a>{' '}
            and RANA
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Created with ❤️ by{' '}
            <a
              href="https://betr.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              betr.ai
            </a>
            {' '}and{' '}
            <a
              href="https://waymaker.cx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              waymaker.cx
            </a>
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Sponsored by{' '}
            <a
              href="https://betr.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              betr.ai
            </a>
            {' '}· With special support from the team
          </p>
        </footer>
      </div>
    </div>
  );
}
