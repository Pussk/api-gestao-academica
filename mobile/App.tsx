import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView,
  ScrollView, Text, TextInput, View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ApiError, api } from "./api";
import {
  choicesFor, config, entryTitle, fieldValue, formFor, payloadFor, resources,
  type Entry, type Form, type Records, type Resource,
} from "./resources";
import { colors, styles } from "./styles";

type Session = { email: string; token: string };
type Screen = { kind: "list" } | { kind: "detail"; entry: Entry } | { kind: "form"; id?: number };

function Button({
  label, onPress, disabled, tone = "primary",
}: { label: string; onPress: () => void; disabled?: boolean; tone?: "primary" | "secondary" | "danger" }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button, styles[tone], (pressed || disabled) && styles.dim,
      ]}
    >
      <Text style={[styles.buttonText, tone === "secondary" && styles.secondaryText]}>{label}</Text>
    </Pressable>
  );
}

function Notice({ message }: { message: string }) {
  return <Text accessibilityRole="alert" style={styles.notice}>{message}</Text>;
}

function Login({ onLogin, message }: { onLogin: (session: Session) => void; message: string }) {
  const [needsAccount, setNeedsAccount] = useState<boolean>();
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const checkSetup = useCallback(async () => {
    setChecking(true);
    setError("");
    try {
      const setup = await api<{ needsAccount: boolean }>("/auth/setup");
      setNeedsAccount(setup.needsAccount);
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { void checkSetup(); }, [checkSetup]);

  async function submit() {
    setError("");
    if (!email.trim() || password.length < 8) {
      setError("Informe um e-mail e uma senha com pelo menos 8 caracteres.");
      return;
    }

    setBusy(true);
    const body = { email: email.trim(), password };
    try {
      if (needsAccount) {
        await api("/auth/setup", { method: "POST", body });
        setNeedsAccount(false);
      }
      onLogin(await api<Session>("/auth/login", { method: "POST", body }));
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 409) setNeedsAccount(false);
      setError(errorMessage(problem));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.loginPage} keyboardShouldPersistTaps="handled">
      <View style={styles.loginCard}>
        <Brand />
        <Text accessibilityRole="header" style={styles.title}>
          {needsAccount ? "Criar conta de acesso" : "Entrar"}
        </Text>
        {needsAccount && <Text style={styles.muted}>Configure a conta que vai acessar esta base acadêmica.</Text>}
        {!!(error || message) && <Notice message={error || message} />}
        {checking ? <ActivityIndicator color={colors.brand} /> : needsAccount === undefined ? (
          <Button label="Tentar conectar novamente" onPress={() => void checkSetup()} />
        ) : (
          <>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              accessibilityLabel="E-mail" style={styles.input} value={email} onChangeText={setEmail}
              autoCapitalize="none" autoComplete="email" keyboardType="email-address"
              placeholder="nome@exemplo.com" placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>Senha</Text>
            <TextInput
              accessibilityLabel="Senha" style={styles.input} value={password} onChangeText={setPassword}
              secureTextEntry autoCapitalize="none" autoComplete={needsAccount ? "new-password" : "current-password"}
              onSubmitEditing={() => { if (!busy) void submit(); }}
            />
            <Button
              label={busy ? "Aguarde…" : needsAccount ? "Criar conta e entrar" : "Entrar"}
              disabled={busy} onPress={() => void submit()}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandIcon}><Text style={styles.brandInitials}>GA</Text></View>
      <Text style={styles.brandName}>Gestão Acadêmica</Text>
    </View>
  );
}

function errorMessage(problem: unknown) {
  return problem instanceof Error ? problem.message : "Ocorreu um erro.";
}

function Workspace({ session, onExit }: { session: Session; onExit: (message: string) => void }) {
  const [resource, setResource] = useState<Resource>("students");
  const [screen, setScreen] = useState<Screen>({ kind: "list" });
  const [records, setRecords] = useState<Records>({ students: [], teachers: [], courses: [], enrollments: [] });
  const [form, setForm] = useState<Form>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const section = config[resource];
  const locked = loading || busy;

  const reportError = useCallback((problem: unknown, display: (message: string) => void) => {
    if (problem instanceof ApiError && problem.status === 401) {
      onExit("Sua sessão terminou. Entre novamente.");
      return;
    }
    display(errorMessage(problem));
  }, [onExit]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const options = { token: session.token };
    try {
      const [students, teachers, courses, enrollments] = await Promise.all([
        api<Entry[]>("/students", options),
        api<Entry[]>("/teachers", options),
        api<Entry[]>("/courses", options),
        api<Entry[]>("/enrollments", options),
      ]);
      setRecords({ students, teachers, courses, enrollments });
    } catch (problem) {
      reportError(problem, setLoadError);
    } finally {
      setLoading(false);
    }
  }, [reportError, session.token]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      await action();
    } catch (problem) {
      reportError(problem, setError);
    } finally {
      setBusy(false);
    }
  }

  function showList(nextResource = resource) {
    setResource(nextResource);
    setScreen({ kind: "list" });
    setError("");
    setFeedback("");
  }

  function showForm(entry?: Entry) {
    setError("");
    setFeedback("");
    setForm(formFor(resource, entry));
    setScreen({ kind: "form", id: entry?.id });
  }

  function showDetail(id: number) {
    void run(async () => {
      const entry = await api<Entry>(`/${resource}/${id}`, { token: session.token });
      setScreen({ kind: "detail", entry });
    });
  }

  function save(id?: number) {
    void run(async () => {
      const path = id === undefined ? `/${resource}` : `/${resource}/${id}`;
      await api<Entry>(path, {
        method: id === undefined ? "POST" : "PUT",
        token: session.token,
        body: payloadFor(resource, form),
      });
      showList();
      setFeedback(id === undefined ? "Registro criado." : "Registro atualizado.");
      await refresh();
    });
  }

  function remove(id: number) {
    setConfirmDelete(false);
    void run(async () => {
      await api(`/${resource}/${id}`, { method: "DELETE", token: session.token });
      showList();
      setFeedback("Registro excluído.");
      await refresh();
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.top}>
        <Brand />
        <Button label="Sair" tone="secondary" onPress={() => onExit("")} disabled={busy} />
      </View>

      <View accessibilityRole="tablist" style={styles.tabs}>
        {resources.map((item) => (
          <Pressable
            key={item} accessibilityRole="tab" accessibilityState={{ selected: item === resource }}
            disabled={locked} onPress={() => showList(item)}
            style={[styles.tab, item === resource && styles.selectedTab]}
          >
            <Text style={[styles.tabText, item === resource && styles.selectedText]}>{config[item].plural}</Text>
          </Pressable>
        ))}
      </View>

      {(loading || busy) && <ActivityIndicator color={colors.brand} accessibilityLabel="Carregando" />}
      {!!error && <Notice message={error} />}
      {!!feedback && <Text accessibilityLiveRegion="polite" style={styles.success}>{feedback}</Text>}
      {!!loadError && (
        <View style={styles.panel}>
          <Notice message={loadError} />
          <Button label="Atualizar lista" onPress={() => void refresh()} disabled={locked} />
        </View>
      )}

      {screen.kind === "list" && (
        <>
          <View style={styles.sectionHeading}>
            <Text accessibilityRole="header" style={styles.title}>{section.plural}</Text>
            <Button label="+ Adicionar" onPress={() => showForm()} disabled={locked || !!loadError} />
          </View>
          {!loading && !loadError && records[resource].length === 0 && (
            <View style={styles.panel}><Text style={styles.muted}>Nenhum registro cadastrado.</Text></View>
          )}
          {!loadError && records[resource].map((entry) => {
            const title = entryTitle(resource, entry, records);
            const summaryFields = section.fields.filter(({ key }) => key !== "name" && key !== "title" && key !== "studentId");
            return (
              <Pressable
                key={entry.id} accessibilityRole="button" accessibilityLabel={`Abrir ${title}`}
                disabled={locked} onPress={() => showDetail(entry.id)}
                style={({ pressed }) => [styles.row, pressed && styles.dim]}
              >
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{title}</Text>
                  <Text style={styles.muted}>
                    {summaryFields.map((field) => fieldValue(field, entry, records)).join(" · ")}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </>
      )}

      {screen.kind === "detail" && (
        <View style={styles.panel}>
          <View style={styles.actions}>
            <Button label="Voltar" tone="secondary" onPress={() => showList()} disabled={locked} />
          </View>
          <Text accessibilityRole="header" style={styles.title}>{entryTitle(resource, screen.entry, records)}</Text>
          {section.fields.map((field) => (
            <View key={field.key} style={styles.detailLine}>
              <Text style={styles.label}>{field.label}</Text>
              <Text style={styles.detailValue}>{fieldValue(field, screen.entry, records)}</Text>
            </View>
          ))}
          <View style={styles.actions}>
            <Button label="Editar" onPress={() => showForm(screen.entry)} disabled={locked} />
            <Button label="Excluir" tone="danger" onPress={() => setConfirmDelete(true)} disabled={locked} />
          </View>
          <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
            <View style={styles.modalBackdrop}>
              <View accessibilityViewIsModal style={styles.modal}>
                <Text accessibilityRole="header" style={styles.title}>Excluir registro?</Text>
                <Text style={styles.muted}>{entryTitle(resource, screen.entry, records)}</Text>
                <View style={styles.actions}>
                  <Button label="Cancelar" tone="secondary" onPress={() => setConfirmDelete(false)} />
                  <Button label="Confirmar exclusão" tone="danger" onPress={() => remove(screen.entry.id)} />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {screen.kind === "form" && (
        <View style={styles.panel}>
          <Text accessibilityRole="header" style={styles.title}>
            {screen.id === undefined ? "Cadastrar" : "Editar"} {section.singular.toLowerCase()}
          </Text>
          {section.fields.map((field) => {
            const value = form[field.key] ?? "";
            const change = (text: string) => setForm((current) => ({ ...current, [field.key]: text }));
            return (
              <View key={field.key} style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                {field.choices ? (
                  <View style={styles.actions}>
                    {choicesFor(field, records).map((choice) => (
                      <Pressable
                        key={choice.value} accessibilityRole="radio"
                        accessibilityState={{ checked: value === choice.value }}
                        disabled={locked} onPress={() => change(choice.value)}
                        style={[styles.choice, value === choice.value && styles.selectedTab]}
                      >
                        <Text style={[styles.tabText, value === choice.value && styles.selectedText]}>{choice.label}</Text>
                      </Pressable>
                    ))}
                    {choicesFor(field, records).length === 0 && (
                      <Text style={styles.muted}>Cadastre em {config[field.choices as Resource].plural} primeiro.</Text>
                    )}
                  </View>
                ) : (
                  <TextInput
                    accessibilityLabel={field.label} style={styles.input} value={value} onChangeText={change}
                    autoCapitalize={field.type === "email" ? "none" : "sentences"}
                    keyboardType={field.type === "email" ? "email-address" : field.type === "number" ? "number-pad" : "default"}
                    editable={!locked}
                  />
                )}
              </View>
            );
          })}
          <View style={styles.actions}>
            <Button label="Salvar" onPress={() => save(screen.id)} disabled={locked} />
            <Button label="Cancelar" tone="secondary" onPress={() => showList()} disabled={locked} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

export default function App() {
  const [session, setSession] = useState<Session>();
  const [message, setMessage] = useState("");
  const exit = useCallback((notice: string) => {
    setMessage(notice);
    setSession(undefined);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.safe}>
        {session ? <Workspace session={session} onExit={exit} /> : <Login onLogin={setSession} message={message} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
