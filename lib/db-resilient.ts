/**
 * Resilient Database Operations Helper
 * Gracefully handles database schema mismatches (e.g. missing optional columns)
 * by detecting PostgREST schema cache errors and retrying without the unrecognized fields.
 */

const MISSING_COLUMN_REGEXES = [
  /Could not find the ['"]?([a-zA-Z0-9_]+)['"]? column of/i,
  /column ["']?([a-zA-Z0-9_]+)["']? of relation/i,
  /column ["']?([a-zA-Z0-9_]+)["']? does not exist/i,
  /Could not find the property ['"]?([a-zA-Z0-9_]+)['"]?/i,
];

function extractMissingColumn(errorMessage: string): string | null {
  for (const regex of MISSING_COLUMN_REGEXES) {
    const match = errorMessage.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function stripProperty(objOrArray: any, prop: string): any {
  if (Array.isArray(objOrArray)) {
    return objOrArray.map((item) => stripProperty(item, prop));
  }
  if (objOrArray && typeof objOrArray === "object") {
    const copy = { ...objOrArray };
    delete copy[prop];
    return copy;
  }
  return objOrArray;
}

/**
 * Executes a Supabase insert, automatically stripping unsupported columns and retrying.
 */
export async function resilientInsert(
  client: any,
  tableName: string,
  initialPayload: Record<string, any> | Record<string, any>[],
  maxRetries: number = 8
): Promise<{ data: any; error: any }> {
  let currentPayload = Array.isArray(initialPayload)
    ? initialPayload.map((item) => ({ ...item }))
    : { ...initialPayload };

  // Table specific adjustments for schema backwards compatibility
  if (tableName === "study_materials") {
    const adjust = (item: any) => ({
      url: item.file_url || item.url || null,
      content: item.description || item.content || item.title || "Study material notes",
      material_type: item.material_type || (item.category?.toLowerCase().includes("pdf") ? "link" : "note"),
      ...item,
    });
    currentPayload = Array.isArray(currentPayload)
      ? currentPayload.map(adjust)
      : adjust(currentPayload);
  }

  if (tableName === "mock_tests") {
    const adjust = (item: any) => ({
      is_published: item.status === "published" || (item.is_published ?? true),
      ...item,
    });
    currentPayload = Array.isArray(currentPayload)
      ? currentPayload.map(adjust)
      : adjust(currentPayload);
  }

  if (tableName === "exams") {
    const adjust = (item: any) => ({
      is_active: item.status === "published" || (item.is_active ?? true),
      ...item,
    });
    currentPayload = Array.isArray(currentPayload)
      ? currentPayload.map(adjust)
      : adjust(currentPayload);
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const query = client.from(tableName).insert(currentPayload);
    const { data, error } = Array.isArray(currentPayload)
      ? await query.select()
      : await query.select().single();

    if (!error) {
      return { data, error: null };
    }

    const missingCol = extractMissingColumn(error.message);
    if (missingCol) {
      console.warn(`[resilientInsert] Table '${tableName}' missing column '${missingCol}'. Stripping and retrying...`);
      currentPayload = stripProperty(currentPayload, missingCol);
      continue;
    }

    // Unrecognized or fatal error
    return { data: null, error };
  }

  return { data: null, error: new Error(`Failed to insert into ${tableName} after stripping missing columns`) };
}

/**
 * Executes a Supabase update, automatically stripping unsupported columns and retrying.
 */
export async function resilientUpdate(
  client: any,
  tableName: string,
  id: string,
  initialPayload: Record<string, any>,
  maxRetries: number = 8
): Promise<{ data: any; error: any }> {
  let currentPayload = { ...initialPayload };

  if (tableName === "mock_tests" && currentPayload.status !== undefined) {
    currentPayload.is_published = currentPayload.status === "published";
  }

  if (tableName === "exams" && currentPayload.status !== undefined) {
    currentPayload.is_active = currentPayload.status === "published";
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error } = await client
      .from(tableName)
      .update(currentPayload)
      .eq("id", id)
      .select()
      .single();

    if (!error) {
      return { data, error: null };
    }

    const missingCol = extractMissingColumn(error.message);
    if (missingCol) {
      console.warn(`[resilientUpdate] Table '${tableName}' missing column '${missingCol}'. Stripping and retrying...`);
      currentPayload = stripProperty(currentPayload, missingCol);
      continue;
    }

    return { data: null, error };
  }

  return { data: null, error: new Error(`Failed to update ${tableName} after stripping missing columns`) };
}
