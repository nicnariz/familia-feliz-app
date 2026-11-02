import { useMemo } from 'react';
import { currentFamily, currentMember, currentUser, errorMessage, familyMembers, useAppState } from './data/store';
import { can } from './data/rules';
import { useFeedback } from './ui/Feedback';

/** Contexto da sessão atual: estado, usuário, família ativa e a pessoa (membership) logada. */
export function useSession() {
  const s = useAppState();
  return useMemo(() => {
    const me = currentMember(s);
    const family = currentFamily(s);
    return {
      s,
      user: currentUser(s),
      me,
      family,
      members: familyMembers(s, family?.id),
      canManage: can.manage(me),
      canApprove: can.approve(me),
    };
  }, [s]);
}

/** Executa uma ação; mostra o erro amigável num aviso e, se der certo, a mensagem de sucesso. Retorna se deu certo. */
export function useRun() {
  const fb = useFeedback();
  return async function run(fn: () => unknown, success?: string): Promise<boolean> {
    try {
      await fn();
      if (success) fb.toast(success);
      return true;
    } catch (e) {
      fb.toast(errorMessage(e));
      return false;
    }
  };
}
