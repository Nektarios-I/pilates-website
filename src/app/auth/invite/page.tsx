import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { authDebugEnabled } from '@/lib/auth/debug';
import { createPageMetadata } from '@/lib/metadata';
import { InviteClient } from './invite-client';

export const metadata = createPageMetadata({
  title: 'Complete Invite',
  description: 'Complete your studio account invitation.',
  path: '/auth/invite',
});

export default function InvitePage() {
  return (
    <Section className="bg-background">
      <Container>
        <div className="py-12">
          <InviteClient debugEnabled={authDebugEnabled()} />
        </div>
      </Container>
    </Section>
  );
}
