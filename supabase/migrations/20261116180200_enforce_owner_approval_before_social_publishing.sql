create or replace function public.enforce_social_post_approval()
returns trigger language plpgsql security invoker set search_path = public, auth as $$
begin
  if tg_op = 'UPDATE' then
    if (new.caption is distinct from old.caption or new.title is distinct from old.title or new.media_urls is distinct from old.media_urls or new.destination_url is distinct from old.destination_url or new.platform_code is distinct from old.platform_code)
       and new.status in ('approved','scheduled','published') then
      raise exception 'Content changes require a fresh owner approval';
    end if;
    if new.status = 'approved' and old.status <> 'approved' then
      if auth.uid() is null or new.approved_by is distinct from auth.uid() or new.approved_at is null then
        raise exception 'Only the authenticated owner can approve this post';
      end if;
    end if;
    if new.status in ('scheduled','published') and old.status not in ('approved','scheduled','published') then
      raise exception 'A post must be approved before scheduling or publishing';
    end if;
  elsif tg_op = 'INSERT' and new.status in ('approved','scheduled','published') then
    raise exception 'New posts must enter the owner approval queue first';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists social_post_approval_guard on public.social_content_posts;
create trigger social_post_approval_guard before insert or update on public.social_content_posts for each row execute function public.enforce_social_post_approval();
