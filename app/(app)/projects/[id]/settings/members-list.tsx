"use client";

import * as React from "react";
import { Trash2, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { removeMemberAction } from "./actions";
import { showToast } from "@/lib/toast";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

interface MembersListProps {
  projectId: string;
  owner: User;
  members: User[];
  isOwner: boolean;
}

export function MembersList({
  projectId,
  owner,
  members,
  isOwner,
}: MembersListProps) {
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const handleRemove = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro do projeto?")) {
      return;
    }

    setRemovingId(userId);
    const result = await removeMemberAction(projectId, userId);
    
    if (result.success) {
      showToast.success("Membro removido", "O usuário não tem mais acesso ao projeto.");
    } else {
      showToast.error("Erro ao remover membro", result.error);
    }
    
    setRemovingId(null);
  };

  return (
    <div className="space-y-3">
      {/* Owner */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{owner.name}</span>
              <Badge variant="warning">Dono</Badge>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {owner.email}
            </p>
          </div>
        </div>
      </div>

      {/* Members */}
      {members.length === 0 ? (
        <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
          Nenhum membro adicionado ainda.
        </div>
      ) : (
        members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
                <span className="text-sm font-medium">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{member.name}</span>
                  <Badge variant="neutral">Membro</Badge>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {member.email}
                </p>
              </div>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(member.id)}
                disabled={removingId === member.id}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
