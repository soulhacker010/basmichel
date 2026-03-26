import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Current time in Amsterdam timezone
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const projects = await base44.asServiceRole.entities.Project.list();

  let updated = 0;

  for (const project of projects) {
    if (!project.shoot_date) continue;

    const shootDate = new Date(project.shoot_date + 'T00:00:00');

    // Build shoot datetime using shoot_time if available
    let shootDateTime = new Date(shootDate);
    if (project.shoot_time) {
      const [h, m] = project.shoot_time.split(':');
      shootDateTime.setHours(parseInt(h), parseInt(m), 0, 0);
    } else {
      shootDateTime.setHours(0, 0, 0, 0);
    }

    // geboekt → shoot_uitgevoerd: shoot datetime has passed
    if (project.status === 'geboekt' && shootDateTime <= now) {
      await base44.asServiceRole.entities.Project.update(project.id, { status: 'shoot_uitgevoerd' });
      updated++;
      continue;
    }

    // shoot_uitgevoerd → wordt_bewerkt: shoot date was yesterday or earlier
    if (project.status === 'shoot_uitgevoerd' && shootDate < today) {
      await base44.asServiceRole.entities.Project.update(project.id, { status: 'wordt_bewerkt' });
      updated++;
    }
  }

  return Response.json({ updated, message: `${updated} project(en) bijgewerkt` });
});